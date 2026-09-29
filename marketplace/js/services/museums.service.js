// ═══════════════════════════════════════════════════════════════
// MUSEUMS SERVICE
// ═══════════════════════════════════════════════════════════════

import { http } from "../core/http.js";

export const museumsService = {
  list:        ()                  => http.get("/museums"),
  getBySlug:   (slug)              => http.get(`/museums/${slug}`),
  create:      (data)              => http.post("/museums", data),
  update:      (slug, data)        => http.put(`/museums/${slug}`, data),
  patch:       (slug, partial)     => http.patch(`/museums/${slug}`, partial),
  delete:      (slug)              => http.delete(`/museums/${slug}`),
};
