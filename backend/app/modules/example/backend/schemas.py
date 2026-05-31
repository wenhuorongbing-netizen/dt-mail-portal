from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ExampleItemCreate(BaseModel):
    title: str
    status: str = "draft"


class ExampleItemRead(BaseModel):
    id: int
    title: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
