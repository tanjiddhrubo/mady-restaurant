/**
 * Admin dashboard logic.
 */
import { api } from '../api.js';

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  initNotifications();
  
  // Refresh data every 30 seconds
  setInterval(() => {
    updateStats();
    updateNotifications();
  }, 30000);
});

async function initDashboard() {
  await updateStats();
}

async function updateStats() {
  try {
    const stats = await api.getDashboardStats();
    const elSales = document.getElementById('stat-sales');
    const elOrders = document.getElementById('stat-orders');
    const elDelivered = document.getElementById('stat-delivered');
    const elAvg = document.getElementById('stat-avg');

    if (elSales) elSales.textContent = `৳${stats.gross_sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (elOrders) elOrders.textContent = stats.orders_count;
    if (elDelivered) elDelivered.textContent = stats.delivered_count;
    if (elAvg) elAvg.textContent = `৳${stats.avg_order_value.toFixed(2)}`;
  } catch (e) {
    console.warn('Dashboard stats refresh failed:', e.message);
  }
}

function initNotifications() {
  const btn = document.getElementById('notif-btn');
  const dropdown = document.getElementById('notif-dropdown');
  
  if (!btn || !dropdown) return;

  btn.onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  };

  document.onclick = () => dropdown.classList.add('hidden');
  dropdown.onclick = (e) => e.stopPropagation();

  updateNotifications();
}

async function updateNotifications() {
  try {
    const orders = await api.getOrders();
    const pending = orders.filter(o => o.status === 'pending');
    
    const badge = document.getElementById('notif-badge');
    const list = document.getElementById('notif-list');
    
    if (badge) {
      if (pending.length > 0) {
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    if (list) {
      if (orders.length === 0) {
        list.innerHTML = '<div class="p-8 text-center text-slate-400"><p class="text-xs">No notifications yet</p></div>';
        return;
      }

      list.innerHTML = orders.slice(0, 5).map(o => `
        <div class="p-4 hover:bg-slate-50 transition-colors cursor-pointer border-l-4 ${o.status === 'pending' ? 'border-primary' : 'border-transparent'}">
          <div class="flex justify-between items-start mb-1">
            <p class="text-sm font-bold text-slate-800">${o.customer_name}</p>
            <span class="text-[10px] text-slate-400">${formatTime(o.created_at)}</span>
          </div>
          <p class="text-xs text-slate-500 truncate">Order #${o.id.toString().slice(-4)} • ৳${o.total_amount.toFixed(2)}</p>
          <div class="mt-2 flex items-center justify-between">
             <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusStyle(o.status)}">
               ${o.status}
             </span>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.warn('Notification refresh failed:', e.message);
  }
}

function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 60000); // minutes
  
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return date.toLocaleDateString();
}

function getStatusStyle(status) {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-700';
    case 'preparing': return 'bg-blue-100 text-blue-700';
    case 'delivered': return 'bg-green-100 text-green-700';
    default: return 'bg-slate-100 text-slate-500';
  }
}
