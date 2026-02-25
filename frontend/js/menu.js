/**
 * Menu page logic — loads categories & items from the API,
 * renders food cards, and redirects to FoodPanda on order.
 */
import { api, FOODPANDA_URL } from './api.js';

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

  grid.innerHTML = items.filter(i => i.is_available).map(renderFoodCard).join('');

  grid.querySelectorAll('[data-foodpanda-url]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.itemId ? Number(btn.dataset.itemId) : null;
      const url = btn.dataset.foodpandaUrl || FOODPANDA_URL;
      api.trackClick(itemId);
      window.open(url, '_blank');
    });
  });
}

function renderFoodCard(item) {
  const fpUrl = item.foodpanda_url || FOODPANDA_URL;
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
        <button class="mt-auto w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-primary/20"
          data-foodpanda-url="${fpUrl}"
          data-item-id="${item.id}"
          data-name="${item.name}">
          <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
          Order on FoodPanda
        </button>
      </div>
    </div>`;
}

// Search
function setupSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    document.querySelectorAll('[data-foodpanda-url]').forEach((btn) => {
      const card = btn.closest('div.bg-white');
      const name = btn.dataset.name.toLowerCase();
      card.style.display = name.includes(q) ? '' : 'none';
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  await loadMenuItems();
  setupSearch();
});
