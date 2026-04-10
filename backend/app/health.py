from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from db.config.database import get_db

health_router = APIRouter()

@health_router.get("/health")
def health_check(db: Session = Depends(get_db)):
    health_status = {"status": "ok", "components": {"api": "ok", "database": "error"}}
    
    try:
        # Try to execute a simple query to check DB connection
        db.execute(text("SELECT 1"))
        health_status["components"]["database"] = "ok"
    except Exception as e:
        health_status["status"] = "error"
        health_status["components"]["database"] = f"error: {str(e)}"
        raise HTTPException(status_code=503, detail=health_status)
    
    return health_status
