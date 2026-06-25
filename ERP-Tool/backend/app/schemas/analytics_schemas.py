from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AnalyticsDummyBase(BaseModel):
    name: str

class AnalyticsDummyCreate(AnalyticsDummyBase):
    pass

class AnalyticsDummyResponse(AnalyticsDummyBase):
    id: str

    class Config:
        from_attributes = True
