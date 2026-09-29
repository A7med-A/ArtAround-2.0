// ═══════════════════════════════════════════════════════════════
// HTTP — wrapper fetch con JWT, gestione errori, base URL
// ═══════════════════════════════════════════════════════════════

import { CONFIG } from "./config.js";

export class HttpError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

const API_STATUS_EVENT = "aa:api-status";

function setApiStatus(connected) {
  window.dispatchEvent(new CustomEvent(API_STATUS_EVENT, { detail: connected }));
}

export function onApiStatusChange(handler) {
  window.addEventListener(API_STATUS_EVENT, (e) => handler(e.detail));
}

function getToken() {
  return localStorage.getItem(CONFIG.STORAGE.TOKEN);
}

function buildUrl(path, query) {
  const url = new URL(CONFIG.API_BASE_URL + path, window.location.origin);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, v);
      }
    });
  }
  return url.toString();
}

async function request(method, path, { body, query, headers = {} } = {}) {
  const token = getToken();
  const init = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };
  if (body !== undefined) init.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(buildUrl(path, query), init);
  } catch (networkErr) {
    setApiStatus(false);
    throw new HttpError("Errore di rete", 0, null);
  }
  setApiStatus(true);

  if (res.status === 204) return null;

  const ct = res.headers.get("content-type") || "";
  const payload = ct.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && payload.error) ||
      (typeof payload === "string" && payload) ||
      res.statusText ||
      "Errore di rete";

    if (res.status === 401) {
      localStorage.removeItem(CONFIG.STORAGE.TOKEN);
      localStorage.removeItem(CONFIG.STORAGE.USER);
      if (!window.location.pathname.endsWith("/login.html")) {
        window.location.href = CONFIG.ROUTES.LOGIN;
      }
    }
    throw new HttpError(message, res.status, payload);
  }
  return payload;
}

export const http = {
  get:    (path, opts) => request("GET",    path, opts),
  post:   (path, body, opts) => request("POST",   path, { ...opts, body }),
  put:    (path, body, opts) => request("PUT",    path, { ...opts, body }),
  patch:  (path, body, opts) => request("PATCH",  path, { ...opts, body }),
  delete: (path, opts) => request("DELETE", path, opts),
};
