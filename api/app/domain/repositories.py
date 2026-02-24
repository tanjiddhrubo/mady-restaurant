"""
Abstract repository interfaces — the dependency inversion point.
The application layer depends on THESE interfaces, not on concrete DB code.
Swap the infrastructure implementation to change databases.
"""
from abc import ABC, abstractmethod
from typing import Optional

from app.domain.models import Category, MenuItem, Order, OrderStatus


class AbstractMenuRepository(ABC):
    @abstractmethod
    def get_all_categories(self) -> list[Category]: ...

    @abstractmethod
    def get_menu_items(self, category_id: Optional[int] = None) -> list[MenuItem]: ...

    @abstractmethod
    def get_menu_item_by_id(self, item_id: int) -> Optional[MenuItem]: ...

    @abstractmethod
    def create_menu_item(self, item: MenuItem) -> MenuItem: ...

    @abstractmethod
    def update_menu_item(self, item: MenuItem) -> MenuItem: ...

    @abstractmethod
    def delete_menu_item(self, item_id: int) -> bool: ...

    @abstractmethod
    def create_category(self, category: Category) -> Category: ...


class AbstractOrderRepository(ABC):
    @abstractmethod
    def create_order(self, order: Order, items: list[dict]) -> Order: ...

    @abstractmethod
    def get_all_orders(self) -> list[Order]: ...

    @abstractmethod
    def get_order_by_id(self, order_id: int) -> Optional[Order]: ...

    @abstractmethod
    def update_order_status(self, order_id: int, status: OrderStatus) -> Optional[Order]: ...

    @abstractmethod
    def get_recent_orders(self, limit: int = 10) -> list[Order]: ...
