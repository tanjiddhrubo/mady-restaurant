"""
Concrete SQLModel implementation of AbstractMenuRepository.
Swap this class to change the persistence layer without touching service/domain code.
"""
from typing import Optional

from sqlmodel import Session, select

from app.domain.models import Category, MenuItem
from app.domain.repositories import AbstractMenuRepository


class SqlMenuRepository(AbstractMenuRepository):
    def __init__(self, session: Session):
        self.session = session

    def get_all_categories(self) -> list[Category]:
        return self.session.exec(
            select(Category).order_by(Category.display_order)
        ).all()

    def get_menu_items(self, category_id: Optional[int] = None) -> list[MenuItem]:
        query = select(MenuItem).where(MenuItem.is_available == True)
        if category_id is not None:
            query = query.where(MenuItem.category_id == category_id)
        return self.session.exec(query).all()

    def get_menu_item_by_id(self, item_id: int) -> Optional[MenuItem]:
        return self.session.get(MenuItem, item_id)

    def create_menu_item(self, item: MenuItem) -> MenuItem:
        self.session.add(item)
        self.session.commit()
        self.session.refresh(item)
        return item

    def update_menu_item(self, item: MenuItem) -> MenuItem:
        self.session.add(item)
        self.session.commit()
        self.session.refresh(item)
        return item

    def delete_menu_item(self, item_id: int) -> bool:
        item = self.session.get(MenuItem, item_id)
        if not item:
            return False
        self.session.delete(item)
        self.session.commit()
        return True

    def create_category(self, category: Category) -> Category:
        self.session.add(category)
        self.session.commit()
        self.session.refresh(category)
        return category
