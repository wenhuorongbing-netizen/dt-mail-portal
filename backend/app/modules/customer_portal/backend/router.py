from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.orders.backend.models import Order

router = APIRouter()


@router.get("/handover-template")
def handover_template() -> dict[str, object]:
    return {
        "title": "D-Ticket account handover",
        "sections": [
            "Mailbox login",
            "TicketPlus+ login guide",
            "Cancellation deadline",
            "Privacy and account use rules",
        ],
    }


@router.get("/order")
def query_customer_order(code: str, db: Session = Depends(get_db)) -> dict[str, object]:
    """Secure endpoint for customers to query their mailbox login details.
    
    This only returns non-sensitive fields. It omits internal notes and audit logs.
    """
    stmt = select(Order).where(Order.order_code == code.strip())
    order = db.scalar(stmt)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Order not found. Please verify the code or contact support."
        )
        
    result = {
        "order_code": order.order_code,
        "status": order.status,
        "passenger_name": order.passenger_name,
        "ticket_month": order.ticket_month,
        "start_date": order.start_date.isoformat() if order.start_date else None,
        "ticket_month_count": order.ticket_month_count,
        "after_tenth_day": order.after_tenth_day,
        "ticket_price_total": order.ticket_price_total,
        "service_fee": order.service_fee,
        "total_amount": order.total_amount,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "mailbox_record": None
    }
    
    if order.mailbox_record:
        result["mailbox_record"] = {
            "local_part": order.mailbox_record.local_part,
            "domain": order.mailbox_record.domain,
            "full_email": order.mailbox_record.full_email,
            "password": order.mailbox_record.password
        }
        
    return result
