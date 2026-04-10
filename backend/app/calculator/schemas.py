from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class CalculateRequest(BaseModel):
    expression: str
    session_id: int

class CalculateResponse(BaseModel):
    result: str

class HistoryItemBase(BaseModel):
    expression: str
    result: str
    created_at: datetime

class HistoryItemSchema(HistoryItemBase):
    id: int
    session_id: int
    
    model_config = ConfigDict(from_attributes=True)

class SessionCreate(BaseModel):
    name: str

class SessionRename(BaseModel):
    name: str

class SessionSchema(BaseModel):
    id: int
    name: str
    user_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
