/**
 * Cart state manager — persists to localStorage.
 * Import this module on any page that needs cart access.
 */

const CART_KEY = 'mady_cart';

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: getCart() }));
}

export function getCart() {
  return loadCart();
}

export function addItem(item) {
  // item: { id, name, price, image_url }
  const cart = loadCart();
  const existing = cart.find((c) => c.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  saveCart(cart);
}

export function removeItem(itemId) {
  const cart = loadCart().filter((c) => c.id !== itemId);
  saveCart(cart);
}

export function updateQty(itemId, qty) {
  const cart = loadCart();
  const item = cart.find((c) => c.id === itemId);
  if (!item) return;
  if (qty <= 0) {
    removeItem(itemId);
    return;
  }
  item.quantity = qty;
  saveCart(cart);
}

export function clearCart() {
  saveCart([]);
}

export function getTotal() {
  return loadCart().reduce((sum, c) => sum + c.price * c.quantity, 0);
}

export function getItemCount() {
  return loadCart().reduce((sum, c) => sum + c.quantity, 0);
}

/** Sync all cart-badge elements on the page */
export function updateCartBadge() {
  const count = getItemCount();
  document.querySelectorAll('[data-cart-badge]').forEach((el) => {
    el.textContent = count;
    el.style.display = count > 0 ? '' : 'none';
  });
}
