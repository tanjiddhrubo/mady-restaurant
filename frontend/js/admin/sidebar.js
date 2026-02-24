/**
 * Shared Admin Sidebar — inject on every admin page.
 *
 * Usage (in each admin HTML):
 *   <div id="admin-sidebar-root"></div>
 *   <script type="module" src="../js/admin/sidebar.js"></script>
 *
 * The module reads window.location.pathname to highlight the active link.
 */

const NAV_LINKS = [
  { href: "index.html",      icon: "dashboard",   label: "Dashboard" },
  { href: "orders.html",     icon: "receipt_long", label: "Orders" },
  { href: "menu.html",       icon: "menu_book",   label: "Menu" },
  { href: "categories.html", icon: "folder",      label: "Categories" },
  { href: "analytics.html",  icon: "analytics",   label: "Analytics" },
  { href: "staff.html",      icon: "group",       label: "Staff" },
];

function currentPage() {
  const parts = window.location.pathname.split("/");
  return parts[parts.length - 1] || "index.html";
}

function renderSidebar() {
  const active = currentPage();

  const links = NAV_LINKS.map(({ href, icon, label }) => {
    const isActive = active === href;
    const cls = isActive
      ? "flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-xl font-semibold"
      : "flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-primary/5 hover:text-primary rounded-xl transition-colors font-medium";
    return `
      <a href="${href}" class="${cls}">
        <span class="material-symbols-outlined">${icon}</span>
        <span>${label}</span>
      </a>`;
  }).join("");

  return `
    <aside class="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-full">
      <!-- Branding -->
      <div class="p-4 flex items-center border-b border-slate-100">
        <img src="../../assets/images/mady_logo.jpeg" alt="Mady Restaurant"
             class="h-12 w-auto object-contain"/>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-4 py-4 space-y-1">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-3">Main Menu</p>
        ${links}
      </nav>

      <!-- User footer -->
      <div class="p-4 border-t border-slate-100">
        <div class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
          <div class="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">A</div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold truncate">Alex Mady</p>
            <p class="text-xs text-slate-400 truncate">Admin Manager</p>
          </div>
          <span class="material-symbols-outlined text-slate-300 text-sm">logout</span>
        </div>
        <a href="../index.html" class="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-primary transition-colors mt-1">
          <span class="material-symbols-outlined text-sm">storefront</span> View Store
        </a>
      </div>
    </aside>`;
}

// Mount on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("admin-sidebar-root");
  if (!root) return;
  root.insertAdjacentHTML("beforebegin", renderSidebar());
  root.remove();
});
