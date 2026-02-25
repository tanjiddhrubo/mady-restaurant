/**
 * Shared Admin Sidebar — inject on every admin page.
 * • Auth guard: redirects to /admin/login.html if no token.
 * • Mobile: hamburger button toggles a slide-in drawer.
 */
import { requireAuth, logout } from '/js/admin/auth.js';

// ── Auth guard (runs before anything renders) ───────────────────────────────
if (!requireAuth()) {
  // requireAuth already called window.location.replace — stop execution
  throw new Error("Redirecting to login…");
}
// ────────────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: "/admin/index.html",      icon: "dashboard",   label: "Dashboard" },
  { href: "/admin/menu.html",       icon: "menu_book",   label: "Menu" },
  { href: "/admin/categories.html", icon: "folder",      label: "Categories" },
  { href: "/admin/analytics.html",  icon: "analytics",   label: "Analytics" },
];

function currentPage() {
  const parts = window.location.pathname.split("/");
  return parts[parts.length - 1] || "index.html";
}

function renderSidebar() {
  const active = currentPage();

  const links = NAV_LINKS.map(({ href, icon, label }) => {
    const isActive = href.endsWith(active);
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
    <!-- ── MOBILE TOP BAR ─────────────────────────────── -->
    <div id="mobile-topbar"
         class="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 flex items-center justify-between px-4 h-14 shadow-sm">
      <img src="/assets/images/mady_logo.jpeg" alt="Mady" class="h-9 w-auto object-contain"/>
      <button id="sidebar-open-btn" aria-label="Open menu"
              class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors">
        <span class="material-symbols-outlined text-slate-700">menu</span>
      </button>
    </div>

    <!-- ── MOBILE BACKDROP ───────────────────────────── -->
    <div id="sidebar-backdrop"
         class="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm hidden transition-opacity"></div>

    <!-- ── SIDEBAR ────────────────────────────────────── -->
    <aside id="admin-sidebar"
           class="fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-white border-r border-slate-200 flex flex-col h-full
                  -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out">

      <!-- Branding + close -->
      <div class="p-4 flex items-center justify-between border-b border-slate-100">
        <img src="/assets/images/mady_logo.jpeg" alt="Mady Restaurant" class="h-12 w-auto object-contain"/>
        <button id="sidebar-close-btn" aria-label="Close menu"
                class="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors">
          <span class="material-symbols-outlined text-slate-500">close</span>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-3">Main Menu</p>
        ${links}
      </nav>

      <!-- User footer -->
      <div class="p-4 border-t border-slate-100">
        <div class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors">
          <div class="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">A</div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold truncate">Admin</p>
            <p class="text-xs text-slate-400 truncate">Mady Restaurant</p>
          </div>
          <button id="logout-btn" title="Log out"
                  class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-slate-400 text-[20px]">logout</span>
          </button>
        </div>
        <a href="/" class="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-primary transition-colors mt-1">
          <span class="material-symbols-outlined text-sm">storefront</span> View Store
        </a>
      </div>
    </aside>`;
}

// Mount + wire up toggle
document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("admin-sidebar-root");
  if (!root) return;
  root.insertAdjacentHTML("beforebegin", renderSidebar());
  root.remove();

  const sidebar  = document.getElementById("admin-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  const openBtn  = document.getElementById("sidebar-open-btn");
  const closeBtn = document.getElementById("sidebar-close-btn");

  // Logout
  document.getElementById("logout-btn")?.addEventListener("click", () => {
    if (confirm("Log out of the admin panel?")) logout();
  });

  // Add top-padding to main on mobile so content isn't behind topbar
  const main = document.querySelector("main");
  if (main) main.classList.add("pt-14", "md:pt-0");

  function openSidebar() {
    sidebar.classList.remove("-translate-x-full");
    backdrop.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    sidebar.classList.add("-translate-x-full");
    backdrop.classList.add("hidden");
    document.body.style.overflow = "";
  }

  openBtn?.addEventListener("click", openSidebar);
  closeBtn?.addEventListener("click", closeSidebar);
  backdrop?.addEventListener("click", closeSidebar);

  // Close sidebar on nav link tap (mobile UX)
  sidebar?.querySelectorAll("a[href]").forEach(a =>
    a.addEventListener("click", closeSidebar)
  );
});
