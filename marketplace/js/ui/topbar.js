// ═══════════════════════════════════════════════════════════════
// TOPBAR — barra superiore dell'app loggata.
// ═══════════════════════════════════════════════════════════════

import { CONFIG } from "../core/config.js";
import { store } from "../core/store.js";
import { onApiStatusChange } from "../core/http.js";
import { iconHTML } from "./icon.js";
import { mountThemeToggle } from "./theme-toggle.js";

const SECTION_META = {
  [CONFIG.SECTIONS.ITEMS]:  { label: "Item Manager",    labelIt: "Contenuti",          icon: "items" },
  [CONFIG.SECTIONS.VISITS]: { label: "Visit Editor",    labelIt: "Visite",             icon: "visits" },
  [CONFIG.SECTIONS.MAP]:    { label: "Map Editor",      labelIt: "Mappa",              icon: "map" },
  [CONFIG.SECTIONS.USERS]:  { label: "Gestione utenti", labelIt: "Account & accessi",  icon: "users" },
};

/**
 * Monta la topbar nel target.
 * @param {HTMLElement} target
 */
export function mountTopbar(target) {
  target.classList.add("aa-topbar");

  let apiConnected = true;

  const render = () => {
    const section = store.section.get();
    const meta = SECTION_META[section] || SECTION_META[CONFIG.SECTIONS.ITEMS];

    target.innerHTML = `
      <button class="aa-topbar__hamburger" type="button" aria-label="Apri menu" data-action="toggle-sidebar">
        ${iconHTML("menu", { size: 18 })}
      </button>
      <div class="aa-topbar__title">
        ${iconHTML(meta.icon, { size: 14, color: "var(--t-gold)" })}
        <span class="aa-topbar__name">${meta.label}</span>
        <span class="aa-topbar__sep">·</span>
        <span class="aa-topbar__sub">${meta.labelIt}</span>
      </div>
      <div class="aa-topbar__right">
        <div class="aa-topbar__status">
          <div class="aa-topbar__status-dot" style="background:${apiConnected ? 'var(--t-success)' : 'var(--t-danger)'}"></div>
          <span class="aa-topbar__status-label">${apiConnected ? "API connected" : "API offline"}</span>
        </div>
        <div class="aa-topbar__vsep"></div>
        <button class="aa-theme-toggle" data-slot="theme"></button>
        <span class="aa-topbar__version">v1.0.0</span>
      </div>
    `;

    // Monta il theme toggle
    const themeSlot = target.querySelector('[data-slot="theme"]');
    if (themeSlot) mountThemeToggle(themeSlot);
  };

  render();

  // Click handlers
  target.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "toggle-sidebar") {
      window.dispatchEvent(new CustomEvent("aa:sidebar-toggle"));
    }
  });

  // React al cambio sezione
  store.section.subscribe(() => render());

  // React allo status API
  onApiStatusChange((connected) => {
    apiConnected = connected;
    const dot = target.querySelector(".aa-topbar__status-dot");
    const lbl = target.querySelector(".aa-topbar__status-label");
    if (dot) dot.style.background = connected ? "var(--t-success)" : "var(--t-danger)";
    if (lbl) lbl.textContent = connected ? "API connected" : "API offline";
  });
}
