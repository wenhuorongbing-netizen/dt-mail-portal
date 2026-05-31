import random
import string
import json
from datetime import datetime
from pathlib import Path
from typing import Optional, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.orders.backend.models import Order, MailboxRecord, AuditLog
from app.modules.orders.backend.schemas import (
    OrderCreate, OrderUpdate, OrderRead, StatusUpdate, MailboxRead, AuditLogRead
)

router = APIRouter()


def calculate_ticket_price(start_date: datetime) -> tuple[int, float, bool]:
    """Calculate billing info based on the 10th-day Deutschlandticket policy.
    
    Returns:
        tuple[month_count (int), price_total (float), after_10th (bool)]
    """
    day = start_date.day
    if day <= 10:
        return 1, 63.0, False
    else:
        return 2, 126.0, True


def generate_random_password(length: int = 10) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(random.choices(chars, k=length))


@router.get("", response_model=list[OrderRead])
def list_orders(db: Session = Depends(get_db)) -> list[Order]:
    return list(db.scalars(
        select(Order)
        .order_by(desc(Order.id))
    ))


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)) -> Order:
    start_date = payload.start_date or datetime.now()
    month_count, price_total, after_10th = calculate_ticket_price(start_date)
    
    # Generate unique order code
    order_code = f"DT-{start_date.strftime('%y%m')}-{random.randint(1000, 9999)}"
    
    total_amount = price_total + payload.service_fee
    
    order = Order(
        order_code=order_code,
        customer_label=payload.customer_label,
        customer_contact=payload.customer_contact,
        passenger_name=payload.passenger_name,
        passenger_birthdate=payload.passenger_birthdate,
        ticket_month=payload.ticket_month or start_date.strftime("%Y-%m"),
        start_date=start_date,
        after_tenth_day=after_10th,
        ticket_month_count=month_count,
        ticket_price_total=price_total,
        service_fee=payload.service_fee,
        total_amount=total_amount,
        status="requested"
    )
    
    db.add(order)
    db.flush()  # populate order ID
    
    audit_log = AuditLog(
        order_id=order.id,
        action="order_created",
        metadata_json=json.dumps({
            "message": "Order registered by operator",
            "calculated_months": month_count,
            "total_ticket_price": price_total,
            "service_fee": payload.service_fee,
            "total_amount": total_amount,
        })
    )
    db.add(audit_log)
    db.commit()
    db.refresh(order)
    return order


@router.get("/{order_id}", response_model=OrderRead)
def get_order(order_id: int, db: Session = Depends(get_db)) -> Order:
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.patch("/{order_id}/status", response_model=OrderRead)
def update_order_status(
    order_id: int, payload: StatusUpdate, db: Session = Depends(get_db)
) -> Order:
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    
    old_status = order.status
    new_status = payload.status
    
    order.status = new_status
    if new_status == "delivered_to_customer":
        order.delivered_at = datetime.now()
        
    audit_log = AuditLog(
        order_id=order.id,
        action="status_transition",
        metadata_json=json.dumps({
            "old_status": old_status,
            "new_status": new_status,
            "additional_info": payload.metadata or {}
        })
    )
    db.add(audit_log)
    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_id}/mailbox", response_model=OrderRead)
def generate_mailbox(order_id: int, db: Session = Depends(get_db)) -> Order:
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    
    if order.mailbox_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Order already has a mailbox generated"
        )
        
    # Generate local part e.g., dt202606001 where 001 is padded order id
    date_str = order.created_at.strftime("%Y%m") if order.created_at else datetime.now().strftime("%Y%m")
    local_part = f"dt{date_str}{order.id:03d}"
    domain = "tickets.buffjo.top"
    full_email = f"{local_part}@{domain}"
    password = generate_random_password()
    
    mailbox = MailboxRecord(
        order_id=order.id,
        local_part=local_part,
        domain=domain,
        full_email=full_email,
        password=password
    )
    db.add(mailbox)
    
    # Transition status to account_registered as per status flow
    old_status = order.status
    order.status = "account_registered"
    
    audit_log = AuditLog(
        order_id=order.id,
        action="mailbox_generated",
        metadata_json=json.dumps({
            "local_part": local_part,
            "full_email": full_email,
            "old_status": old_status,
            "new_status": order.status
        })
    )
    db.add(audit_log)
    db.commit()
    db.refresh(order)
    return order


@router.get("/{order_id}/handover")
def render_handover_text(order_id: int, db: Session = Depends(get_db)) -> dict[str, str]:
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    if not order.mailbox_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Cannot generate handover text: Mailbox has not been created yet."
        )
        
    # Find templates directory
    project_root = Path(__file__).resolve().parents[5]
    template_path = project_root / "templates" / "customer-handover-cn.md"
    
    template_content = ""
    if template_path.exists():
        template_content = template_path.read_text(encoding="utf-8")
    else:
        # Fallback template content in case file is missing
        template_content = (
            "【您的 D-Ticket 专用邮箱账号已创建】\n\n"
            "邮箱登录地址：\nhttps://webmail.buffjo.top\n\n"
            "邮箱用户名：\n{{mailbox_local_part}}\n\n"
            "邮箱密码：\n{{mailbox_password}}\n\n"
            "注意：登录邮箱时只输入用户名，不用输入 @tickets.buffjo.top。\n\n"
            "TicketPlus+ 登录时请输入完整邮箱：\n{{full_email}}\n\n"
            "TicketPlus+ 登录步骤：\n"
            "1. 打开 TicketPlus+ App。\n"
            "2. 选择 Email Login。\n"
            "3. 输入完整邮箱：{{full_email}}\n"
            "4. 回到邮箱收取验证码。\n"
            "5. 回到 App 输入验证码。\n"
            "6. 打开 Deutschlandticket 二维码页面。\n\n"
            "重要提醒：\n"
            "- 月票为实名票，请使用本人证件乘车。\n"
            "- 查票前请提前登录 App，确认二维码可以显示。\n"
            "- 本服务为独立账号邮箱与购票协助服务，非 TicketPlus+、DB 或任何交通公司官方服务。\n"
        )
        
    # Interpolate values
    mailbox = order.mailbox_record
    rendered_text = (
        template_content
        .replace("{{mailbox_local_part}}", mailbox.local_part)
        .replace("{{mailbox_password}}", mailbox.password)
        .replace("{{full_email}}", mailbox.full_email)
    )
    
    return {"rendered_text": rendered_text}
