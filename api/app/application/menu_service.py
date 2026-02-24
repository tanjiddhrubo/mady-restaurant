"""
Menu use-case service — orchestrates domain logic using the abstract repository.
"""
from typing import Optional

from app.domain.models import Category, MenuItem
from app.domain.repositories import AbstractMenuRepository


class MenuService:
    def __init__(self, repo: AbstractMenuRepository):
        self.repo = repo

    def get_all_categories(self) -> list[Category]:
        return self.repo.get_all_categories()

    def get_menu_items(self, category_id: Optional[int] = None) -> list[MenuItem]:
        return self.repo.get_menu_items(category_id)

    def get_menu_item(self, item_id: int) -> Optional[MenuItem]:
        return self.repo.get_menu_item_by_id(item_id)

    def create_item(self, item: MenuItem) -> MenuItem:
        return self.repo.create_menu_item(item)

    def update_item(self, item: MenuItem) -> MenuItem:
        return self.repo.update_menu_item(item)

    def delete_item(self, item_id: int) -> bool:
        return self.repo.delete_menu_item(item_id)

    def create_category(self, category: Category) -> Category:
        return self.repo.create_category(category)
