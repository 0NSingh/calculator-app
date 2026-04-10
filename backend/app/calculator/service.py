from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import re
from db.config.database import get_db
from db.models import HistorySession, HistoryItem, User
from ..auth.service import get_current_user
from .schemas import (
    CalculateRequest, CalculateResponse, 
    SessionSchema, SessionCreate, SessionRename,
    HistoryItemSchema
)

cal_router = APIRouter()

def safe_eval(expression: str):
    # Only allow digits, operators, and parentheses
    if not re.match(r'^[0-9+\-*/().\s]+$', expression):
        raise ValueError("Invalid characters in expression")
    try:
        # Use a restricted environment for eval
        result = eval(expression, {"__builtins__": {}}, {})
        return str(result)
    except Exception as e:
        raise ValueError(f"Invalid expression: {str(e)}")

@cal_router.post("/calculate", response_model=CalculateResponse)
def calculate(
    request: CalculateRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify session belongs to user
    session = db.query(HistorySession).filter(
        HistorySession.id == request.session_id,
        HistorySession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        result = safe_eval(request.expression)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Save to history
    history_item = HistoryItem(
        expression=request.expression,
        result=result,
        session_id=request.session_id
    )
    db.add(history_item)
    db.commit()
    db.refresh(history_item)
    
    return {"result": result}

@cal_router.get("/sessions", response_model=List[SessionSchema])
def get_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(HistorySession).filter(HistorySession.user_id == current_user.id).all()

@cal_router.post("/sessions", response_model=SessionSchema)
def create_session(
    session_in: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = HistorySession(name=session_in.name, user_id=current_user.id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@cal_router.patch("/sessions/{session_id}", response_model=SessionSchema)
def rename_session(
    session_id: int,
    session_in: SessionRename,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(HistorySession).filter(
        HistorySession.id == session_id,
        HistorySession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.name = session_in.name
    db.commit()
    db.refresh(session)
    return session

@cal_router.delete("/sessions/{session_id}")
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(HistorySession).filter(
        HistorySession.id == session_id,
        HistorySession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    return {"message": "Session deleted"}

@cal_router.get("/history/{session_id}", response_model=List[HistoryItemSchema])
def get_history(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify session belongs to user
    session = db.query(HistorySession).filter(
        HistorySession.id == session_id,
        HistorySession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return db.query(HistoryItem).filter(HistoryItem.session_id == session_id).order_by(HistoryItem.created_at.desc()).all()

@cal_router.delete("/history/{item_id}")
def delete_history_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find item and verify it belongs to a session of the current user
    item = db.query(HistoryItem).join(HistorySession).filter(
        HistoryItem.id == item_id,
        HistorySession.user_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="History item not found")
    
    db.delete(item)
    db.commit()
    return {"message": "History item deleted"}
