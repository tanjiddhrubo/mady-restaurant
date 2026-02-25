/**
 * Auth utilities for the Mady Admin Panel.
 * Uses a JWT stored in sessionStorage.
 */

const TOKEN_KEY = "mady_admin_token";

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function saveToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

/**
 * Call from any protected page.
 * Redirects to login if no token is present.
 */
export function requireAuth() {
  if (!getToken()) {
    window.location.replace("/admin/login.html");
    return false;
  }
  return true;
}

/**
 * Log in with email + password.
 * On success saves the token and returns it.
 * Throws on failure.
 */
export async function login(email, password) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Invalid credentials");
  }
  const data = await res.json();
  saveToken(data.token);
  return data;
}

/**
 * Log out and redirect to login page.
 */
export function logout() {
  clearToken();
  window.location.replace("/admin/login.html");
}

/**
 * Returns Authorization header object for fetch calls.
 */
export function authHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
