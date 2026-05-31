from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.example.backend.models import ExampleItem
from app.modules.example.backend.schemas import ExampleItemCreate, ExampleItemRead

router = APIRouter()


@router.get("/items", response_model=list[ExampleItemRead])
def list_items(db: Session = Depends(get_db)) -> list[ExampleItem]:
    return list(db.scalars(select(ExampleItem).order_by(ExampleItem.created_at.desc())))


@router.post("/items", response_model=ExampleItemRead, status_code=status.HTTP_201_CREATED)
def create_item(payload: ExampleItemCreate, db: Session = Depends(get_db)) -> ExampleItem:
    item = ExampleItem(name=payload.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db)) -> None:
    item = db.get(ExampleItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
