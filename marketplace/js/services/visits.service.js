// ═══════════════════════════════════════════════════════════════
// VISITS SERVICE — nested sotto /museums/:slug/visits
// ═══════════════════════════════════════════════════════════════

import { http } from "../core/http.js";

export const visitsService = {
  listByMuseum: (slug)             => http.get(`/museums/${slug}/visits`),
  get:          (slug, id)         => http.get(`/museums/${slug}/visits/${id}`),
  create:       (slug, data)       => http.post(`/museums/${slug}/visits`, data),
  update:       (slug, id, data)   => http.put(`/museums/${slug}/visits/${id}`, data),
  delete:       (slug, id)         => http.delete(`/museums/${slug}/visits/${id}`),
};
