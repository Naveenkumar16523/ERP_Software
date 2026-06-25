from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PayrollDummyBase(BaseModel):
    name: str

class PayrollDummyCreate(PayrollDummyBase):
    pass

class PayrollDummyResponse(PayrollDummyBase):
    id: str

    class Config:
        from_attributes = True
