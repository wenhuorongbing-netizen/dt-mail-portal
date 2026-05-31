from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import Base, engine, get_db
from app.modules.example.backend.models import ExampleItem
from app.modules.example.backend.schemas import ExampleItemCreate, ExampleItemRead

Base.metadata.create_all(bind=engine)

router = APIRouter()


@router.get("/items", response_model=list[ExampleItemRead])
def list_items(db: Session = Depends(get_db)) -> list[ExampleItem]:
    return list(db.scalars(select(ExampleItem).order_by(ExampleItem.id.desc())))


@router.post("/items", response_model=ExampleItemRead, status_code=status.HTTP_201_CREATED)
def create_item(payload: ExampleItemCreate, db: Session = Depends(get_db)) -> ExampleItem:
    item = ExampleItem(title=payload.title, status=payload.status)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)) -> dict[str, int]:
    item = db.get(ExampleItem, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    db.delete(item)
    db.commit()
    return {"deleted": item_id}
