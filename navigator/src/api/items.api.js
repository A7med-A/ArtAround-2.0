// ═══════════════════════════════════════════════════════════════
// ITEMS API — /api/museums/:slug/items/*
// ═══════════════════════════════════════════════════════════════

import api from "./client";

/** GET /api/museums/:slug/items — tutte le opere del museo. */
export async function fetchItems(slug) {
  const { data } = await api.get(`/museums/${slug}/items`);
  return data;
}

/** GET /api/museums/:slug/items/:id — singola opera. */
export async function fetchItem(slug, id) {
  const { data } = await api.get(`/museums/${slug}/items/${id}`);
  return data;
}
