// ═══════════════════════════════════════════════════════════════
// THEME TOGGLE — bottone dark/light.
// ═══════════════════════════════════════════════════════════════

import { theme } from "../core/theme.js";
import { iconHTML } from "./icon.js";

/**
 * Renderizza un theme toggle nel DOM target.
 * @param {HTMLElement} target — elemento dove montare il toggle
 */
export function mountThemeToggle(target) {
  const update = () => {
    const t = theme.current();
    target.innerHTML = `
      ${iconHTML(t === "dark" ? "moon" : "sun", { size: 14 })}
      <span>${t === "dark" ? "Dark" : "Light"}</span>
    `;
  };
  target.classList.add("aa-theme-toggle");
  target.type = "button";
  target.addEventListener("click", () => {
    theme.toggle();
    update();
  });
  update();
}
