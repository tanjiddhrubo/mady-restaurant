"""
Order use-case service.
"""
from typing import Optional

from app.domain.models import Order, OrderStatus
from app.domain.repositories import AbstractOrderRepository


class OrderService:
    def __init__(self, repo: AbstractOrderRepository):
        self.repo = repo

    def place_order(self, order: Order, items: list[dict]) -> Order:
        return self.repo.create_order(order, items)

    def get_all_orders(self) -> list[Order]:
        return self.repo.get_all_orders()

    def get_order(self, order_id: int) -> Optional[Order]:
        return self.repo.get_order_by_id(order_id)

    def update_status(self, order_id: int, status: OrderStatus) -> Optional[Order]:
        return self.repo.update_order_status(order_id, status)

    def get_recent_orders(self, limit: int = 10) -> list[Order]:
        return self.repo.get_recent_orders(limit)

    def get_dashboard_stats(self) -> dict:
        orders = self.repo.get_all_orders()
        delivered = [o for o in orders if o.status == OrderStatus.DELIVERED]
        total_sales = sum(o.total_amount for o in delivered)
        avg_value = (total_sales / len(delivered)) if delivered else 0.0
        return {
            "gross_sales": round(total_sales, 2),
            "orders_count": len(orders),
            "delivered_count": len(delivered),
            "avg_order_value": round(avg_value, 2),
        }
