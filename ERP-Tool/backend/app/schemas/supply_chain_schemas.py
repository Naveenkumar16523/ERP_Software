from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Supply_chainDummyBase(BaseModel):
    name: str

class Supply_chainDummyCreate(Supply_chainDummyBase):
    pass

class Supply_chainDummyResponse(Supply_chainDummyBase):
    id: str

    class Config:
        from_attributes = True
