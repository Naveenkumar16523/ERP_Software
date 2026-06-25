from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AssetsDummyBase(BaseModel):
    name: str

class AssetsDummyCreate(AssetsDummyBase):
    pass

class AssetsDummyResponse(AssetsDummyBase):
    id: str

    class Config:
        from_attributes = True
