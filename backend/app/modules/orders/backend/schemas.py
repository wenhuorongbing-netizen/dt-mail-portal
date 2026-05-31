from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel, ConfigDict


class MailboxRead(BaseModel):
    id: int
    order_id: int
    local_part: str
    domain: str
    full_email: str
    password: str
    created_at: datetime
    handed_over_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AuditLogRead(BaseModel):
    id: int
    order_id: int
    action: str
    metadata_json: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    customer_label: str
    customer_contact: Optional[str] = None
    passenger_name: Optional[str] = None
    passenger_birthdate: Optional[str] = None
    ticket_month: Optional[str] = None  # e.g., "2026-06"
    start_date: Optional[datetime] = None
    service_fee: float = 10.0


class OrderUpdate(BaseModel):
    customer_label: Optional[str] = None
    customer_contact: Optional[str] = None
    passenger_name: Optional[str] = None
    passenger_birthdate: Optional[str] = None
    ticket_month: Optional[str] = None
    start_date: Optional[datetime] = None
    service_fee: Optional[float] = None
    status: Optional[str] = None


class StatusUpdate(BaseModel):
    status: str
    metadata: Optional[dict[str, Any]] = None


class OrderRead(BaseModel):
    id: int
    order_code: str
    customer_label: str
    customer_contact: Optional[str] = None
    passenger_name: Optional[str] = None
    passenger_birthdate: Optional[str] = None
    ticket_month: Optional[str] = None
    start_date: Optional[datetime] = None
    after_tenth_day: bool
    ticket_month_count: int
    ticket_price_total: float
    service_fee: float
    total_amount: float
    status: str
    created_at: datetime
    updated_at: datetime
    delivered_at: Optional[datetime] = None
    mailbox_record: Optional[MailboxRead] = None
    audit_logs: list[AuditLogRead] = []

    model_config = ConfigDict(from_attributes=True)
