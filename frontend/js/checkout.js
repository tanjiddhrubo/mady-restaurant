/**
 * Checkout page — reads cart, renders order summary, submits to API.
 */
import { api } from './api.js';
import { getCart, getTotal, clearCart } from './cart.js';

function renderOrderSummary() {
  const cart = getCart();
  const list = document.getElementById('order-items-list');
  if (!list) return;

  if (!cart.length) {
    list.innerHTML = '<p class="text-slate-400 text-sm">Your cart is empty.</p>';
    return;
  }

  list.innerHTML = cart
    .map(
      (item) => `
    <div class="flex gap-4">
      <div class="w-16 h-16 rounded-lg overflow-hidden shrink-0">
        <img src="${item.image_url}" class="w-full h-full object-cover" alt="${item.name}"/>
      </div>
      <div class="flex-1">
        <div class="flex justify-between">
          <h4 class="font-bold text-sm">${item.name}</h4>
          <span class="font-bold text-sm">৳${(item.price * item.quantity).toFixed(2)}</span>
        </div>
        <div class="mt-1">
          <span class="text-xs bg-slate-100 px-2 py-0.5 rounded">Qty: ${item.quantity}</span>
        </div>
      </div>
    </div>`
    )
    .join('');

  const subtotal = getTotal();
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  document.getElementById('subtotal').textContent = `৳${subtotal.toFixed(2)}`;
  document.getElementById('tax').textContent = `৳${tax.toFixed(2)}`;
  document.getElementById('grand-total').textContent = `৳${total.toFixed(2)}`;
  
  const buttons = document.querySelectorAll('[data-order-btn], button[type="submit"]');
  buttons.forEach(btn => {
    if (btn.id !== 'back-btn') { // Don't update the back arrow
      btn.innerHTML = `Place Order • ৳${total.toFixed(2)} <span class="material-symbols-outlined ml-2">shopping_bag</span>`;
    }
  });
}

function validateBDPhone(phone) {
  // Regex for BD numbers: 013-019 followed by 8 digits. Optional +88 or 88 prefix.
  const regex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
  return regex.test(phone.replace(/\s|-/g, ''));
}

async function handlePlaceOrder(e) {
  e.preventDefault();
  
  const cart = getCart();
  if (!cart.length) {
    alert('Your cart is empty!');
    return;
  }

  // Get Fields
  const nameEl = document.getElementById('full-name');
  const phoneEl = document.getElementById('phone');
  const streetEl = document.getElementById('street');
  const cityEl = document.getElementById('city');
  const zipEl = document.getElementById('zip');

  // Simple Validation
  if (!nameEl.value.trim()) {
    alert('Please enter your full name.');
    nameEl.focus();
    return;
  }

  const phone = phoneEl.value.trim();
  if (!phone) {
    alert('Please enter your phone number.');
    phoneEl.focus();
    return;
  }

  if (!validateBDPhone(phone)) {
    alert('Please enter a valid Bangladeshi phone number (e.g., 017XXXXXXXX).');
    phoneEl.focus();
    return;
  }

  if (!streetEl.value.trim()) {
    alert('Please enter your delivery address.');
    streetEl.focus();
    return;
  }

  // Industry Standard: Loading State
  const submitBtns = document.querySelectorAll('[data-order-btn], button[type="submit"]');
  submitBtns.forEach(btn => {
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin mr-2">progress_activity</span> Processing Order...';
  });

  const payload = {
    customer_name: nameEl.value.trim(),
    customer_phone: phone,
    delivery_address: `${streetEl.value.trim()}, ${cityEl.value.trim()} ${zipEl.value.trim()}`.replace(/,\s+$/, ''),
    notes: '',
    items: cart.map((c) => ({ menu_item_id: c.id, quantity: c.quantity })),
  };

  try {
    const order = await api.createOrder(payload);
    clearCart();
    window.location.href = `confirmation.html?order_id=${order.id}`;
  } catch (err) {
    alert(`Order failed: ${err.message}`);
    // Re-enable on failure
    submitBtns.forEach(btn => {
      btn.disabled = false;
      renderOrderSummary(); // resets text
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderOrderSummary();
  document.getElementById('checkout-form')?.addEventListener('submit', handlePlaceOrder);
  // Separate handling for manual clicks on themed button vs form submit
  document.querySelectorAll('[data-order-btn]').forEach((btn) =>
    btn.addEventListener('click', (e) => {
        if (btn.closest('form')) return; // let form submit reach handler
        handlePlaceOrder(e);
    })
  );
});
