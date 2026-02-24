/**
 * Menu page logic — loads categories & items from the API,
 * renders food cards, and wires up "Add to Cart" buttons.
 */
import { api } from './api.js';
import { addItem, updateCartBadge } from './cart.js';

let selectedCategoryId = null;

async function loadCategories() {
  const sidebar = document.getElementById('category-sidebar');
  const categories = await api.getCategories();

  // "All" link
  sidebar.innerHTML = renderCategoryLink(null, 'restaurant_menu', 'All', true);
  categories.forEach((cat) => {
    sidebar.innerHTML += renderCategoryLink(cat.id, cat.icon, cat.name, false);
  });

  sidebar.querySelectorAll('[data-cat-id]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.dataset.catId ? Number(link.dataset.catId) : null;
      setActiveCategory(id);
    });
  });
}

function renderCategoryLink(id, icon, name, active) {
  const activeClass = active
    ? 'bg-primary/10 text-primary'
    : 'text-slate-500 hover:bg-primary/5 hover:text-primary';
  return `
    <a href="#" data-cat-id="${id ?? ''}"
       class="flex items-center gap-3 p-3 rounded-xl ${activeClass} group transition-colors">
      <span class="material-symbols-outlined">${icon}</span>
      <span class="hidden sm:block font-medium">${name}</span>
    </a>`;
}

function setActiveCategory(id) {
  selectedCategoryId = id;
  document.querySelectorAll('[data-cat-id]').forEach((link) => {
    const isActive = (link.dataset.catId ? Number(link.dataset.catId) : null) === id;
    link.className = `flex items-center gap-3 p-3 rounded-xl group transition-colors ${
      isActive ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-primary/5 hover:text-primary'
    }`;
  });
  loadMenuItems();
}

async function loadMenuItems() {
  const grid = document.getElementById('food-grid');
  grid.innerHTML = '<p class="text-slate-400 col-span-3 text-center py-10">Loading...</p>';

  const items = await api.getMenu(selectedCategoryId);

  if (!items.length) {
    grid.innerHTML = '<p class="text-slate-400 col-span-3 text-center py-10">No items found.</p>';
    return;
  }

  grid.innerHTML = items.map(renderFoodCard).join('');

  grid.querySelectorAll('[data-add-to-cart]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id    = Number(btn.dataset.addToCart);
      const name  = btn.dataset.name;
      const price = Number(btn.dataset.price);
      const img   = btn.dataset.img;
      addItem({ id, name, price, image_url: img });
      updateCartBadge();
      showToast(`${name} added to cart!`);
    });
  });
}

function renderFoodCard(item) {
  return `
    <div class="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div class="h-48 w-full bg-cover bg-center"
           style="background-image:url('${item.image_url}')"></div>
      <div class="p-4 flex flex-col flex-1">
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-bold text-lg text-slate-900">${item.name}</h3>
          <span class="text-primary font-bold">৳${item.price.toFixed(2)}</span>
        </div>
        <p class="text-slate-500 text-sm mb-4 line-clamp-2">${item.description}</p>
        <button class="mt-auto w-full bg-secondary hover:bg-secondary/90 text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          data-add-to-cart="${item.id}"
          data-name="${item.name}"
          data-price="${item.price}"
          data-img="${item.image_url}">
          <span class="material-symbols-outlined text-[20px]">add_shopping_cart</span>
          Add to Cart
        </button>
      </div>
    </div>`;
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className =
    'fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-full shadow-lg text-sm font-semibold z-[999] transition-opacity';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 1800);
}

// Search
function setupSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    document.querySelectorAll('[data-add-to-cart]').forEach((btn) => {
      const card = btn.closest('div.bg-white');
      const name = btn.dataset.name.toLowerCase();
      card.style.display = name.includes(q) ? '' : 'none';
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  updateCartBadge();
  await loadCategories();
  await loadMenuItems();
  setupSearch();
});
