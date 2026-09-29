// ═══════════════════════════════════════════════════════════════
// AUTH API — /api/auth/*
// ═══════════════════════════════════════════════════════════════

import api from "./client";

/** POST /api/auth/login — accetta username oppure email. */
export async function login(usernameOrEmail, password) {
  const { data } = await api.post("/auth/login", {
    username: usernameOrEmail,
    password,
  });
  return data; // { token, user }
}

/** POST /api/auth/register — il Navigator registra sempre ruolo "visitor". */
export async function register({ username, email, password }) {
  const { data } = await api.post("/auth/register", {
    username,
    email,
    password,
    role: "visitor",
  });
  return data; // { token, user }
}

/** POST /api/auth/guest — token dell'account ospite condiviso. */
export async function loginAsGuest() {
  const { data } = await api.post("/auth/guest");
  return data; // { token, user }
}

/** GET /api/auth/me — verifica il token e rinfresca l'utente. */
export async function fetchMe() {
  const { data } = await api.get("/auth/me");
  return data.user;
}
