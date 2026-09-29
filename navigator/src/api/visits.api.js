// ═══════════════════════════════════════════════════════════════
// VISITS API — /api/museums/:slug/visits/*
// Il server restituisce visits con items[] già popolati.
// ═══════════════════════════════════════════════════════════════

import api from "./client";

/** GET /api/museums/:slug/visits — percorsi guidati del museo. */
export async function fetchVisits(slug) {
  const { data } = await api.get(`/museums/${slug}/visits`);
  return data;
}

/** GET /api/museums/:slug/visits/:id — singolo percorso guidato. */
export async function fetchVisit(slug, id) {
  const { data } = await api.get(`/museums/${slug}/visits/${id}`);
  return data;
}
