// ═══════════════════════════════════════════════════════════════
// ITEMS SERVICE — nested sotto /museums/:slug/items
// ═══════════════════════════════════════════════════════════════

import { http } from "../core/http.js";

export const itemsService = {
  listByMuseum: (slug)             => http.get(`/museums/${slug}/items`),
  get:          (slug, id)         => http.get(`/museums/${slug}/items/${id}`),
  create:       (slug, data)       => http.post(`/museums/${slug}/items`, data),
  update:       (slug, id, data)   => http.put(`/museums/${slug}/items/${id}`, data),
  delete:       (slug, id)         => http.delete(`/museums/${slug}/items/${id}`),
};
