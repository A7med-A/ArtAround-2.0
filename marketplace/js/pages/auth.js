// ═══════════════════════════════════════════════════════════════
// AUTH PAGE — bootstrap di login.html
// ═══════════════════════════════════════════════════════════════

import { auth } from "../core/auth.js";
import { theme } from "../core/theme.js";
import { CONFIG } from "../core/config.js";
import { toast } from "../ui/toast.js";
import { mountThemeToggle } from "../ui/theme-toggle.js";

theme.init();
auth.redirectIfLoggedIn();

document.addEventListener("DOMContentLoaded", () => {
  // Monta il theme toggle
  const themeSlot = document.querySelector('[data-slot="theme-toggle"]');
  if (themeSlot) mountThemeToggle(themeSlot);

  const form = document.getElementById("auth-form");
  const submitBtn = document.getElementById("auth-submit");
  let mode = form.dataset.mode || "login";

  // Toggle login/register
  document.querySelectorAll("[data-toggle-mode]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      mode = mode === "login" ? "register" : "login";
      document.body.dataset.mode = mode;
      form.dataset.mode = mode;
      document.getElementById("auth-title").textContent =
        mode === "login" ? "Bentornato" : "Crea il tuo account";
      document.getElementById("auth-subtitle").textContent =
        mode === "login"
          ? "Accedi al tuo account per continuare."
          : "Bastano pochi secondi per iniziare.";
    });
  });

  if (location.hash === "#register") {
    document.querySelector("[data-toggle-mode]")?.click();
  }

  // Nota che spiega cosa comporta il ruolo scelto
  const ROLE_HINTS = {
    author:
      "Cura i contenuti dei musei a cui ti dà accesso un amministratore: opere, visite e mappa.",
    docente:
      "Prepara visite per la tua classe. Non modifichi musei, mappe né opere del museo: quello che crei resta privato e lo vedi solo tu.",
    admin: "Gestisci musei, utenti e accessi.",
  };
  const roleHint = document.querySelector("[data-role-hint]");
  form.addEventListener("change", (e) => {
    if (e.target.name !== "role" || !roleHint) return;
    roleHint.textContent = ROLE_HINTS[e.target.value] || "";
  });

  // Submit
  form.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); form.requestSubmit(); }
  });
  submitBtn.addEventListener("click", () => form.requestSubmit());

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.setAttribute("disabled", "");
    try {
      const username = form.querySelector('[name="username"]').value.trim();
      const password = form.querySelector('[name="password"]').value;
      if (mode === "register") {
        const email = form.querySelector('[name="email"]').value.trim();
        const role = form.querySelector('[name="role"]:checked')?.value || "author";
        await auth.register({ username, email, password, role });
      } else {
        await auth.login(username, password);
      }
      window.location.href = CONFIG.ROUTES.APP;
    } catch (err) {
      toast(err.message || "Errore di autenticazione", "danger");
    } finally {
      submitBtn.removeAttribute("disabled");
    }
  });
});
