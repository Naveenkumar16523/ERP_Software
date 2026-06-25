from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SupportDummyBase(BaseModel):
    name: str

class SupportDummyCreate(SupportDummyBase):
    pass

class SupportDummyResponse(SupportDummyBase):
    id: str

    class Config:
        from_attributes = True
