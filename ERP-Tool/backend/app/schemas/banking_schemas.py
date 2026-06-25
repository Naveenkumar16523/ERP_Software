from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class BankingDummyBase(BaseModel):
    name: str

class BankingDummyCreate(BankingDummyBase):
    pass

class BankingDummyResponse(BankingDummyBase):
    id: str

    class Config:
        from_attributes = True
