// ═══════════════════════════════════════════════════════════════
// APP — bootstrap di app.html (shell loggata)
// ═══════════════════════════════════════════════════════════════

import { auth } from "../core/auth.js";
import { theme } from "../core/theme.js";
import { CONFIG } from "../core/config.js";
import { store } from "../core/store.js";
import { museumsService } from "../services/museums.service.js";
import { mountSidebar } from "../ui/sidebar.js";
import { mountTopbar } from "../ui/topbar.js";

// 1. Tema
theme.init();
// 2. Auth guard
auth.requireAuth();

// 3. Rinfresca l'utente da /me per avere museumSlug aggiornato.
//    Se il token è scaduto, http intercetta il 401 e fa logout automatico.
await auth.refreshMe();

// 4. Bootstrap musei
async function bootstrapMuseums() {
  try {
    const museums = await museumsService.list();
    store.museums.set(Array.isArray(museums) ? museums : []);
    const activeSlug = store.activeMuseum.get();
    const has = activeSlug && museums.some((m) => m.slug === activeSlug);
    if (!has) store.activeMuseum.set(museums[0]?.slug || null);
  } catch (err) {
    console.error("Errore caricamento musei:", err);
  }
}
await bootstrapMuseums();

// 4. Monta shell
mountSidebar(document.getElementById("aa-sidebar"));
mountTopbar(document.getElementById("aa-topbar"));

/**
 * Sezioni permesse al ruolo corrente.
 * La sezione attiva viene ripresa da localStorage: senza questo controllo
 * un docente che in passato è entrata come autore si ritroverebbe sul
 * Map Editor, che il server rifiuterebbe comunque.
 */
function allowedSection(section) {
  if (section === CONFIG.SECTIONS.USERS && !auth.isAdmin()) return CONFIG.SECTIONS.ITEMS;
  if (section === CONFIG.SECTIONS.MAP && !auth.canEditMuseum()) return CONFIG.SECTIONS.VISITS;
  return section;
}

// 5. Router-per-sezione
async function loadSection(requested) {
  const section = allowedSection(requested);
  if (section !== requested) {
    store.section.set(section); // rilancia loadSection con la sezione corretta
    return;
  }

  const outlet = document.getElementById("app-outlet");
  outlet.innerHTML = `<div class="app-section-loader"><div class="aa-spinner"></div></div>`;
  try {
    let mod;
    switch (section) {
      case CONFIG.SECTIONS.ITEMS:  mod = await import("../views/items.view.js"); break;
      case CONFIG.SECTIONS.VISITS: mod = await import("../views/visits.view.js"); break;
      case CONFIG.SECTIONS.MAP:    mod = await import("../views/map.view.js"); break;
      case CONFIG.SECTIONS.USERS:  mod = await import("../views/users.view.js"); break;
      default:                     mod = await import("../views/items.view.js");
    }
    await mod.render();
  } catch (err) {
    console.error("Errore caricamento sezione:", err);
    outlet.innerHTML = `
      <div class="aa-empty" style="padding:40px;">
        <div class="aa-empty__title">Errore</div>
        <div class="aa-empty__msg">${(err && err.message) || "Impossibile caricare la sezione"}</div>
      </div>
    `;
  }
}

store.section.subscribe((s) => loadSection(s));
store.activeMuseum.subscribe(() => loadSection(store.section.get()));
