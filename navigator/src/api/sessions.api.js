// ═══════════════════════════════════════════════════════════════
// SESSIONS API — /api/sessions/*
//
// Visite guidate dal vivo. Due tipi di chiamante:
//   • il docente usa il JWT, iniettato dall'interceptor di Axios;
//   • lo studente usa la `streamKey` ricevuta all'ingresso, che viaggia
//     nel corpo della richiesta e vale solo per quella sessione.
// ═══════════════════════════════════════════════════════════════

import api from "./client";
import { API_URL } from "@/constants/config";

// ── Docente ──────────────────────────────────────────────────────

/** POST /api/sessions — apre una sessione e ottiene il codice. */
export async function openSession(museumId, visitId) {
  const { data } = await api.post("/sessions", { museumId, visitId });
  return data; // { session, streamKey, participantId }
}

/** GET /api/sessions — sessioni condotte dal docente. */
export async function fetchSessions(museumId) {
  const { data } = await api.get("/sessions", { params: museumId ? { museumId } : undefined });
  return data;
}

/** GET /api/sessions/:code/monitor — quadro completo della sessione. */
export async function fetchMonitor(code) {
  const { data } = await api.get(`/sessions/${code}/monitor`);
  return data; // { session, visit }
}

/** PATCH /api/sessions/:code — cambia lo stato condiviso. */
export async function controlSession(code, patch) {
  const { data } = await api.patch(`/sessions/${code}`, patch);
  return data;
}

/** POST /api/sessions/:code/grades — calcola o corregge i voti. */
export async function saveGrades(code, body = {}) {
  const { data } = await api.post(`/sessions/${code}/grades`, body);
  return data;
}

/** DELETE /api/sessions/:code */
export async function deleteSession(code) {
  const { data } = await api.delete(`/sessions/${code}`);
  return data;
}

// ── Studente ─────────────────────────────────────────────────────

/** POST /api/sessions/:code/join — entra digitando codice e proprio nome. */
export async function joinSession(code, name) {
  const { data } = await api.post(`/sessions/${code}/join`, { name });
  return data; // { participantId, streamKey, session, visit }
}

/** GET /api/sessions/:code/state — riallineamento se lo stream si interrompe. */
export async function fetchState(code, streamKey) {
  const { data } = await api.get(`/sessions/${code}/state`, { params: { key: streamKey } });
  return data;
}

/** POST /api/sessions/:code/events — segnala una richiesta al docente. */
export async function reportEvent(code, streamKey, event) {
  const { data } = await api.post(`/sessions/${code}/events`, { key: streamKey, ...event });
  return data;
}

/** POST /api/sessions/:code/answers — invia una risposta del quiz. */
export async function submitAnswer(code, streamKey, questionIndex, choice) {
  const { data } = await api.post(`/sessions/${code}/answers`, {
    key: streamKey,
    questionIndex,
    choice,
  });
  return data;
}

/**
 * URL dello stream SSE.
 *
 * La chiave viaggia in query string perché EventSource non permette di
 * impostare header. Non è una credenziale d'account: è un identificativo
 * opaco valido solo per questa sessione, che il server revoca chiudendola.
 */
export function streamUrl(code, streamKey) {
  return `${API_URL}/sessions/${code}/stream?key=${encodeURIComponent(streamKey)}`;
}
