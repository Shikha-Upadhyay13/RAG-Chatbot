// In development, Vite proxies /auth, /sessions, /chat, etc. to the backend,
// so API_BASE can be empty (same-origin). In production, set VITE_API_BASE_URL.
export const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
