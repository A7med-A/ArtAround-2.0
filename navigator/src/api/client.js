// ═══════════════════════════════════════════════════════════════
// HTTP CLIENT — istanza Axios condivisa
//   • inietta il Bearer token su ogni richiesta
//   • normalizza gli errori del server ({ error: "..." }) in Error.message
//   • notifica il logout quando il token non è più valido (401)
// ═══════════════════════════════════════════════════════════════

import axios from "axios";
import { API_URL, STORAGE_KEYS } from "@/constants/config";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ── Token ────────────────────────────────────────────────────────

export function getToken() {
  try {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    else localStorage.removeItem(STORAGE_KEYS.TOKEN);
  } catch {
    /* storage non disponibile (private mode): l'app resta usabile in memoria */
  }
}

// ── Interceptor richiesta ────────────────────────────────────────

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Interceptor risposta ─────────────────────────────────────────

/** Evento emesso quando il server rifiuta il token: l'AuthProvider ascolta. */
export const UNAUTHORIZED_EVENT = "aanav:unauthorized";

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status ?? 0;
    const serverMessage = error.response?.data?.error;

    let message = serverMessage;
    if (!message) {
      if (error.code === "ECONNABORTED") message = "Il server non risponde";
      else if (status === 0) message = "Server non raggiungibile";
      else if (status === 404) message = "Risorsa non trovata";
      else if (status === 403) message = "Accesso non consentito";
      else message = error.message || "Errore imprevisto";
    }

    if (status === 401) {
      setToken(null);
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }

    const normalized = new Error(message);
    normalized.status = status;
    normalized.cause = error;
    return Promise.reject(normalized);
  },
);

export default api;
