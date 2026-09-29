// ═══════════════════════════════════════════════════════════════
// SIDEBAR — brand, museum selector, navigazione, user.
// ═══════════════════════════════════════════════════════════════

import { CONFIG } from "../core/config.js";
import { store } from "../core/store.js";
import { auth } from "../core/auth.js";
import { iconHTML } from "./icon.js";
import { mountMuseumSelector } from "./museum-selector.js";

const NAV_ITEMS = [
  { id: CONFIG.SECTIONS.ITEMS,  label: "Item Manager", labelIt: "Contenuti", icon: "items" },
  { id: CONFIG.SECTIONS.VISITS, label: "Visit Editor", labelIt: "Visite",    icon: "visits" },
  { id: CONFIG.SECTIONS.MAP,    label: "Map Editor",   labelIt: "Mappa",     icon: "map" },
];

// Sezioni riservate a chi cura il museo. Al docente non compaiono affatto:
// un pulsante disabilitato la lascerebbe a chiedersi cosa le manca.
const MUSEUM_ONLY_SECTIONS = [CONFIG.SECTIONS.MAP];

/** Etichette del ruolo mostrate sotto il nome utente. */
const ROLE_LABELS = { admin: "Admin", author: "Autore", docente: "Docente" };

const ADMIN_NAV_ITEMS = [
  { id: CONFIG.SECTIONS.USERS, label: "Gestione utenti", labelIt: "Account & accessi", icon: "users" },
];

/**
 * Monta la sidebar nel target.
 * @param {HTMLElement} target
 */
export function mountSidebar(target) {
  target.classList.add("aa-sidebar");

  const user = auth.currentUser();
  const initial = user?.username ? user.username[0].toUpperCase() : "?";
  const role = ROLE_LABELS[user?.role] || "Autore";
  const active = store.section.get();

  const navItems = auth.canEditMuseum()
    ? NAV_ITEMS
    : NAV_ITEMS.filter((item) => !MUSEUM_ONLY_SECTIONS.includes(item.id));

  target.innerHTML = `
    <div class="aa-sidebar__brand">
      <div class="aa-sidebar__mark">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="8" cy="8" r="2.5" fill="currentColor" opacity="0.6"/>
          <line x1="8" y1="2" x2="8" y2="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="8" y1="12" x2="8" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="2" y1="8" x2="4" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="12" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <div>
        <div class="aa-sidebar__name">ArtAround</div>
        <div class="aa-sidebar__sub">Marketplace</div>
      </div>
    </div>

    <div data-slot="museum-selector"></div>

    <nav class="aa-sidebar__nav">
      <div class="aa-sidebar__section-label">Editor</div>
      ${navItems.map((item) => `
        <button class="aa-nav-item ${item.id === active ? 'is-active' : ''}" data-section="${item.id}">
          ${iconHTML(item.icon, { size: 15, color: item.id === active ? "var(--t-gold)" : "var(--t-textSec)" })}
          <div class="aa-nav-item__text">
            <div class="aa-nav-item__label">${item.label}</div>
            <div class="aa-nav-item__sub">${item.labelIt}</div>
          </div>
          <div class="aa-nav-item__dot"></div>
        </button>
      `).join("")}

      ${auth.isAdmin() ? `
        <div class="aa-sidebar__section-label" style="margin-top:18px;">Admin</div>
        ${ADMIN_NAV_ITEMS.map((item) => `
          <button class="aa-nav-item ${item.id === active ? 'is-active' : ''}" data-section="${item.id}">
            ${iconHTML(item.icon, { size: 15, color: item.id === active ? "var(--t-gold)" : "var(--t-textSec)" })}
            <div class="aa-nav-item__text">
              <div class="aa-nav-item__label">${item.label}</div>
              <div class="aa-nav-item__sub">${item.labelIt}</div>
            </div>
            <div class="aa-nav-item__dot"></div>
          </button>
        `).join("")}
      ` : ""}
    </nav>

    <div class="aa-sidebar__user">
      <div class="aa-avatar">${initial}</div>
      <div class="aa-sidebar__user-info">
        <div class="aa-sidebar__user-name">${user?.username || "Ospite"}</div>
        <div class="aa-sidebar__user-role">${role}</div>
      </div>
      <button class="aa-icon-btn" data-action="logout" title="Esci">
        ${iconHTML("logout", { size: 15 })}
      </button>
    </div>
  `;

  // Monta il museum selector
  const selectorSlot = target.querySelector('[data-slot="museum-selector"]');
  mountMuseumSelector(selectorSlot);

  // Click handler per nav e logout
  target.addEventListener("click", (e) => {
    const navBtn = e.target.closest(".aa-nav-item");
    if (navBtn) {
      store.section.set(navBtn.dataset.section);
      closeMobileDrawer();
      return;
    }
    if (e.target.closest("[data-action='logout']")) {
      auth.logout();
    }
  });

  // Aggiorna evidenziazione sezione attiva
  const updateActive = () => {
    const cur = store.section.get();
    target.querySelectorAll(".aa-nav-item").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.section === cur);
    });
  };
  store.section.subscribe(updateActive);

  // ─── Mobile drawer ──────────────────────────────────────────────
  let backdrop = null;

  function openMobileDrawer() {
    target.classList.add("is-mobile-open");
    if (backdrop) return;
    backdrop = document.createElement("div");
    backdrop.className = "aa-sidebar-backdrop";
    backdrop.addEventListener("click", closeMobileDrawer);
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => backdrop?.classList.add("is-visible"));
  }
  function closeMobileDrawer() {
    target.classList.remove("is-mobile-open");
    if (backdrop) {
      backdrop.classList.remove("is-visible");
      const el = backdrop;
      backdrop = null;
      setTimeout(() => el.remove(), 200);
    }
  }
  function toggleMobileDrawer() {
    if (target.classList.contains("is-mobile-open")) closeMobileDrawer();
    else openMobileDrawer();
  }

  window.addEventListener("aa:sidebar-toggle", toggleMobileDrawer);
}
