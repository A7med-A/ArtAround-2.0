// ═══════════════════════════════════════════════════════════════
// AUTH — login / logout / currentUser / guard
// Comunica con POST /api/auth/login e /register del backend.
// Persiste token + user in localStorage.
// ═══════════════════════════════════════════════════════════════

import { CONFIG } from "./config.js";
import { http } from "./http.js";

export const auth = {
  isLoggedIn() {
    return !!localStorage.getItem(CONFIG.STORAGE.TOKEN);
  },

  currentUser() {
    const raw = localStorage.getItem(CONFIG.STORAGE.USER);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isAdmin() {
    return this.currentUser()?.role === "admin";
  },

  isAuthor() {
    return this.currentUser()?.role === "author";
  },

  /**
   * Docente: prepara visite per la propria classe.
   * Non cura il museo — niente anagrafica, mappa o opere altrui — e tutto
   * ciò che crea resta privato, visibile solo a lui.
   */
  isTeacher() {
    return this.currentUser()?.role === "docente";
  },

  /** Chi può modificare musei, mappa e contenuti del museo. */
  canEditMuseum() {
    return this.isAdmin() || this.isAuthor();
  },

  /** Array degli slug a cui l'autore corrente ha accesso. */
  myMuseumSlugs() {
    return this.currentUser()?.museumSlugs || [];
  },

  async login(usernameOrEmail, password) {
    const { token, user } = await http.post("/auth/login", {
      username: usernameOrEmail,
      password,
    });
    localStorage.setItem(CONFIG.STORAGE.TOKEN, token);
    localStorage.setItem(CONFIG.STORAGE.USER, JSON.stringify(user));
    return user;
  },

  async register({ username, email, password, role }) {
    const { token, user } = await http.post("/auth/register", {
      username, email, password, role,
    });
    localStorage.setItem(CONFIG.STORAGE.TOKEN, token);
    localStorage.setItem(CONFIG.STORAGE.USER, JSON.stringify(user));
    return user;
  },

  /** Rinfresca l'utente da /me (usa il token esistente). */
  async refreshMe() {
    try {
      const { user } = await http.get("/auth/me");
      localStorage.setItem(CONFIG.STORAGE.USER, JSON.stringify(user));
      return user;
    } catch {
      return null;
    }
  },

  logout() {
    Object.values(CONFIG.STORAGE).forEach((k) => localStorage.removeItem(k));
    window.location.href = CONFIG.ROUTES.LOGIN;
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = CONFIG.ROUTES.LOGIN;
      throw new Error("Not authenticated");
    }
    return this.currentUser();
  },

  redirectIfLoggedIn() {
    if (this.isLoggedIn()) {
      window.location.href = CONFIG.ROUTES.APP;
    }
  },
};
