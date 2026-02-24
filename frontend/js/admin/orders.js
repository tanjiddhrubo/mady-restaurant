/**
 * Admin orders page — fetches orders, renders filterable table + detail panel.
 */
import { api } from '../api.js';

let allOrders = [];
let currentStatus = 'pending';

const statusColors = {
  pending:          'bg-primary/10 text-primary border border-primary/20',
  preparing:        'bg-amber-100 text-amber-800 border border-amber-200',
  out_for_delivery: 'bg-blue-100 text-blue-800 border border-blue-200',
  delivered:        'bg-green-100 text-green-800 border border-green-200',
  cancelled:        'bg-slate-100 text-slate-500 border border-slate-200',
};

const statusLabel = {
  pending:          'Pending',
  preparing:        'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
};

async function loadOrders() {
  allOrders = await api.getOrders();
  renderTabs();
  renderTable();
}

function renderTabs() {
  const tabs = document.getElementById('status-tabs');
  const statuses = ['pending', 'preparing', 'out_for_delivery', 'delivered'];
  tabs.innerHTML = statuses.map((s) => {
    const count = allOrders.filter((o) => o.status === s).length;
    const active = s === currentStatus;
    return `<button data-status="${s}"
      class="pb-3 border-b-2 ${active ? 'border-primary text-primary font-bold' : 'border-transparent text-slate-500 hover:text-primary'} text-sm transition-colors">
      ${statusLabel[s]} (${count})
    </button>`;
  }).join('');

  tabs.querySelectorAll('[data-status]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentStatus = btn.dataset.status;
      renderTabs();
      renderTable();
    });
  });
}

function renderTable() {
  const tbody = document.getElementById('orders-tbody');
  const filtered = allOrders.filter((o) => o.status === currentStatus);

  tbody.innerHTML = filtered.map((o) => {
    const ts = new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `
      <tr class="hover:bg-primary/5 cursor-pointer transition-colors" data-order-id="${o.id}">
        <td class="px-6 py-4 font-medium text-primary">#${o.id}</td>
        <td class="px-6 py-4">${o.customer_name}</td>
        <td class="px-6 py-4 text-sm text-slate-600">${o.delivery_address || '—'}</td>
        <td class="px-6 py-4 text-right font-semibold">৳${o.total_amount.toFixed(2)}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[o.status]}">
            ${statusLabel[o.status]}
          </span>
        </td>
        <td class="px-6 py-4 text-sm text-slate-500">${ts}</td>
      </tr>`;
  }).join('') || `<tr><td colspan="6" class="text-center py-10 text-slate-400">No orders here yet.</td></tr>`;

  tbody.querySelectorAll('[data-order-id]').forEach((row) => {
    row.addEventListener('click', () => openDetail(Number(row.dataset.orderId)));
  });
}

function openDetail(orderId) {
  const order = allOrders.find((o) => o.id === orderId);
  if (!order) return;
  const panel = document.getElementById('detail-panel');
  const ts = new Date(order.created_at).toLocaleString();
  document.getElementById('detail-order-id').textContent = `#${order.id}`;
  document.getElementById('detail-customer').textContent = order.customer_name;
  document.getElementById('detail-phone').textContent = order.customer_phone || '—';
  document.getElementById('detail-address').textContent = order.delivery_address || '—';
  document.getElementById('detail-total').textContent = `৳${order.total_amount.toFixed(2)}`;
  document.getElementById('detail-created').textContent = ts;
  document.getElementById('detail-status').textContent = statusLabel[order.status];
  document.getElementById('detail-status').className = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`;

  // Populate status change select
  const sel = document.getElementById('status-select');
  if (sel) {
    sel.value = order.status;
    sel.onchange = async () => {
      await api.updateOrderStatus(order.id, sel.value);
      await loadOrders();
    };
  }

  panel.classList.remove('hidden');
}

document.getElementById('close-panel')?.addEventListener('click', () => {
  document.getElementById('detail-panel').classList.add('hidden');
});

document.addEventListener('DOMContentLoaded', loadOrders);
