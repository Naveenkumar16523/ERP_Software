from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MarketingDummyBase(BaseModel):
    name: str

class MarketingDummyCreate(MarketingDummyBase):
    pass

class MarketingDummyResponse(MarketingDummyBase):
    id: str

    class Config:
        from_attributes = True
