from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProcurementDummyBase(BaseModel):
    name: str

class ProcurementDummyCreate(ProcurementDummyBase):
    pass

class ProcurementDummyResponse(ProcurementDummyBase):
    id: str

    class Config:
        from_attributes = True
