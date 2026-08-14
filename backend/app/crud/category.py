from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


def list_categories(db: Session, *, search: str | None = None) -> tuple[list[Category], int]:
    query = db.query(Category)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(Category.name.ilike(term))
    total = query.count()
    items = query.order_by(Category.created_at.desc()).all()
    return items, total


def get_category_by_id(db: Session, category_id: int) -> Category | None:
    return db.get(Category, category_id)


def get_category_by_name(db: Session, name: str) -> Category | None:
    return db.query(Category).filter(Category.name == name).first()


def create_category(db: Session, payload: CategoryCreate) -> Category:
    category = Category(name=payload.name, description=payload.description)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(db: Session, category: Category, payload: CategoryUpdate) -> Category:
    category.name = payload.name
    category.description = payload.description
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, category: Category) -> None:
    db.delete(category)
    db.commit()
