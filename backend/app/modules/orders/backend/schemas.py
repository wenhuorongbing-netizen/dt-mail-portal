from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OrderRead(BaseModel):
    id: int
    customer_label: str
    mailbox: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
