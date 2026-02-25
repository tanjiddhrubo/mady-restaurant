"""
Domain models — pure Python / SQLModel table definitions.
No infrastructure concerns here; these are the entities of the domain.
"""
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------

class Category(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, max_length=100)
    icon: str = Field(default="restaurant_menu", max_length=50)  # Material Symbol name
    display_order: int = Field(default=0)

    items: list["MenuItem"] = Relationship(back_populates="category")
    subcategories: list["SubCategory"] = Relationship(back_populates="category")


# ---------------------------------------------------------------------------
# SubCategory
# ---------------------------------------------------------------------------

class SubCategory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, max_length=100)
    icon: str = Field(default="label", max_length=50)
    display_order: int = Field(default=0)
    category_id: Optional[int] = Field(default=None, foreign_key="category.id")

    category: Optional[Category] = Relationship(back_populates="subcategories")


# ---------------------------------------------------------------------------
# Menu Item
# ---------------------------------------------------------------------------

class MenuItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=150)
    description: str = Field(default="")
    price: float
    image_url: str = Field(default="")
    rating: float = Field(default=5.0)
    is_available: bool = Field(default=True)
    is_featured: bool = Field(default=False)
    category_id: Optional[int] = Field(default=None, foreign_key="category.id")
    foodpanda_url: str = Field(default="")  # Per-item FoodPanda link; falls back to main if empty

    category: Optional[Category] = Relationship(back_populates="items")
    order_items: list["OrderItem"] = Relationship(back_populates="menu_item")


# ---------------------------------------------------------------------------
# Click Event (Analytics)
# ---------------------------------------------------------------------------

class ClickEvent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    item_id: Optional[int] = Field(default=None)  # None = main shop click
    created_at: datetime = Field(default_factory=datetime.utcnow)



# ---------------------------------------------------------------------------
# Order Status
# ---------------------------------------------------------------------------

class OrderStatus(str, Enum):
    PENDING = "pending"
    PREPARING = "preparing"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


# ---------------------------------------------------------------------------
# Order
# ---------------------------------------------------------------------------

class Order(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_name: str = Field(max_length=150)
    customer_phone: str = Field(default="", max_length=30)
    delivery_address: str = Field(default="")
    status: OrderStatus = Field(default=OrderStatus.PENDING)
    total_amount: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    notes: str = Field(default="")

    order_items: list["OrderItem"] = Relationship(back_populates="order")


# ---------------------------------------------------------------------------
# Order Item (join / line-item)
# ---------------------------------------------------------------------------

class OrderItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: Optional[int] = Field(default=None, foreign_key="order.id")
    menu_item_id: Optional[int] = Field(default=None, foreign_key="menuitem.id")
    quantity: int = Field(default=1)
    unit_price: float  # snapshot of price at time of order

    order: Optional[Order] = Relationship(back_populates="order_items")
    menu_item: Optional[MenuItem] = Relationship(back_populates="order_items")
