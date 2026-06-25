from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AutomationDummyBase(BaseModel):
    name: str

class AutomationDummyCreate(AutomationDummyBase):
    pass

class AutomationDummyResponse(AutomationDummyBase):
    id: str

    class Config:
        from_attributes = True
