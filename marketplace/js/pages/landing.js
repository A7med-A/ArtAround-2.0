// ═══════════════════════════════════════════════════════════════
// LANDING — bootstrap di index.html
// ═══════════════════════════════════════════════════════════════

import { theme } from "../core/theme.js";
import { mountThemeToggle } from "../ui/theme-toggle.js";

theme.init();

// Monta il theme toggle nello slot
const themeSlot = document.querySelector('[data-slot="theme-toggle"]');
if (themeSlot) mountThemeToggle(themeSlot);

// Naviga al click di [data-href] (sostituisce gli onclick inline)
document.addEventListener("click", (e) => {
  const target = e.target.closest("[data-href]");
  if (target) {
    e.preventDefault();
    window.location.href = target.dataset.href;
  }
});
