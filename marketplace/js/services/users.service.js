// ═══════════════════════════════════════════════════════════════
// USERS SERVICE — endpoints admin-only
// ═══════════════════════════════════════════════════════════════

import { http } from "../core/http.js";

export const usersService = {
  list:   ()                          => http.get("/users"),
  grant:  (id, museumSlug)            => http.post(`/users/${id}/grant`,  { museumSlug }),
  revoke: (id, museumSlug)            => http.post(`/users/${id}/revoke`, { museumSlug }),
  delete: (id)                        => http.delete(`/users/${id}`),
};
