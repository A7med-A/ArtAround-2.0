// ═══════════════════════════════════════════════════════════════
// MUSEUMS API — /api/museums/*
// ═══════════════════════════════════════════════════════════════

import api from "./client";

/** GET /api/museums — un visitatore vede tutti i musei pubblicati. */
export async function fetchMuseums() {
  const { data } = await api.get("/museums");
  return data;
}

/** GET /api/museums/:slug — include floors[] con le celle della mappa. */
export async function fetchMuseum(slug) {
  const { data } = await api.get(`/museums/${slug}`);
  return data;
}
