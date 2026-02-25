/**
 * Central fetch utility.
 * All API calls go through here so the base URL is always consistent.
 */
const API_BASE = "";

export async function fetchJSON(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const FOODPANDA_URL = "https://foodpanda.go.link/8E4Aw";

export const api = {
  getCategories: () => fetchJSON("/api/categories"),
  getMenu: (categoryId) =>
    fetchJSON(`/api/menu${categoryId ? `?category_id=${categoryId}` : ""}`),
  getDashboardStats: () => fetchJSON("/api/analytics/clicks"),
  trackClick: (itemId = null) =>
    fetchJSON("/api/analytics/track", {
      method: "POST",
      body: JSON.stringify({ item_id: itemId }),
    }).catch(() => null), // Non-critical, swallow errors
};
