from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class BotBase(BaseModel):
    botId: str
    name: str
    description: str
    icon: str
    category: str
    status: str
    runsToday: int
    successRate: float
    lastRun: Optional[datetime] = None

class BotResponse(BotBase):
    id: str
    createdAt: datetime
    
    class Config:
        from_attributes = True

class BotRunLogBase(BaseModel):
    botId: str
    timestamp: datetime
    logOutput: str
    status: str

class BotRunLogResponse(BotRunLogBase):
    id: str
    createdAt: datetime
    
    class Config:
        from_attributes = True
