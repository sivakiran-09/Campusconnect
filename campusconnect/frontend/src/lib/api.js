// Thin fetch client for the Express backend. If VITE_API_URL is empty the app runs in Demo Mode.
export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const API_ON = !!API_URL;

const KEY = "cc_token";
export const getToken = () => {
  try {
    return localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
};
export const setToken = (t) => {
  try {
    t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
};

export async function api(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API_URL}${path}`, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status, data });
  return data;
}

/** Server-sent events: new messages, notifications and transaction updates. */
export function openStream(onEvent) {
  if (!API_ON || typeof EventSource === "undefined") return () => {};
  const es = new EventSource(`${API_URL}/stream?token=${encodeURIComponent(getToken())}`);
  ["message", "notification", "transaction", "typing"].forEach((t) => es.addEventListener(t, (e) => onEvent(t, JSON.parse(e.data || "{}"))));
  return () => es.close();
}
