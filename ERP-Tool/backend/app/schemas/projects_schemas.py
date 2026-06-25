from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProjectsDummyBase(BaseModel):
    name: str

class ProjectsDummyCreate(ProjectsDummyBase):
    pass

class ProjectsDummyResponse(ProjectsDummyBase):
    id: str

    class Config:
        from_attributes = True
