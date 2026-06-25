from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CrmDummyBase(BaseModel):
    name: str

class CrmDummyCreate(CrmDummyBase):
    pass

class CrmDummyResponse(CrmDummyBase):
    id: str

    class Config:
        from_attributes = True
