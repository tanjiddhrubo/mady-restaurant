"""
Concrete SQLModel implementation of AbstractOrderRepository.
"""
from typing import Optional

from sqlmodel import Session, select

from app.domain.models import MenuItem, Order, OrderItem, OrderStatus
from app.domain.repositories import AbstractOrderRepository


class SqlOrderRepository(AbstractOrderRepository):
    def __init__(self, session: Session):
        self.session = session

    def create_order(self, order: Order, items: list[dict]) -> Order:
        """items: list of {"menu_item_id": int, "quantity": int}"""
        total = 0.0
        order_items = []
        for item_data in items:
            menu_item: Optional[MenuItem] = self.session.get(
                MenuItem, item_data["menu_item_id"]
            )
            if not menu_item:
                continue
            line_total = menu_item.price * item_data["quantity"]
            total += line_total
            order_items.append(
                OrderItem(
                    menu_item_id=menu_item.id,
                    quantity=item_data["quantity"],
                    unit_price=menu_item.price,
                )
            )

        order.total_amount = total
        self.session.add(order)
        self.session.commit()
        self.session.refresh(order)

        for oi in order_items:
            oi.order_id = order.id
            self.session.add(oi)
        self.session.commit()
        self.session.refresh(order)
        return order

    def get_all_orders(self) -> list[Order]:
        return self.session.exec(
            select(Order).order_by(Order.created_at.desc())
        ).all()

    def get_order_by_id(self, order_id: int) -> Optional[Order]:
        return self.session.get(Order, order_id)

    def update_order_status(self, order_id: int, status: OrderStatus) -> Optional[Order]:
        order = self.session.get(Order, order_id)
        if not order:
            return None
        order.status = status
        self.session.add(order)
        self.session.commit()
        self.session.refresh(order)
        return order

    def get_recent_orders(self, limit: int = 10) -> list[Order]:
        return self.session.exec(
            select(Order).order_by(Order.created_at.desc()).limit(limit)
        ).all()
