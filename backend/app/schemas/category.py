from datetime import datetime

from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=2000)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


class CategoryRead(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CategoryListResponse(BaseModel):
    items: list[CategoryRead]
    total: int
    search: str | None = None
