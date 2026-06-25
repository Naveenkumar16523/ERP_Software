from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SecurityDummyBase(BaseModel):
    name: str

class SecurityDummyCreate(SecurityDummyBase):
    pass

class SecurityDummyResponse(SecurityDummyBase):
    id: str

    class Config:
        from_attributes = True
