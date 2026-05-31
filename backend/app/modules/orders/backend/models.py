from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    customer_label: Mapped[str] = mapped_column(String(160), nullable=False)
    customer_contact: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    passenger_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    passenger_birthdate: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    ticket_month: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)  # e.g., "2026-06"
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)  # chosen start date
    after_tenth_day: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ticket_month_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    ticket_price_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    service_fee: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    status: Mapped[str] = mapped_column(String(60), default="requested", nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    mailbox_record: Mapped[Optional["MailboxRecord"]] = relationship("MailboxRecord", back_populates="order", uselist=False)
    audit_logs: Mapped[list["AuditLog"]] = relationship("AuditLog", back_populates="order", cascade="all, delete-orphan")


class MailboxRecord(Base):
    __tablename__ = "mailbox_records"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False)
    local_part: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    domain: Mapped[str] = mapped_column(String(100), default="tickets.buffjo.top", nullable=False)
    full_email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    handed_over_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="mailbox_record")


class AuditLog(Base):
    __tablename__ = "order_audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., "status_change", "mailbox_created"
    metadata_json: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)  # JSON formatted details
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="audit_logs")
