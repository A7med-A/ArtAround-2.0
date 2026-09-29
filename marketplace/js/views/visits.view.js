// ═══════════════════════════════════════════════════════════════
// VISITS VIEW — Visit Editor
// ═══════════════════════════════════════════════════════════════

import { store } from "../core/store.js";
import { auth } from "../core/auth.js";
import { visitsService } from "../services/visits.service.js";
import { itemsService } from "../services/items.service.js";
import { escapeHtml } from "../utils/dom.js";
import { toast } from "../ui/toast.js";
import { iconHTML } from "../ui/icon.js";
import { visitCardHTML } from "../ui/visit-card.js";
import { mountVisitEditPanel } from "../ui/visit-edit-panel.js";
import { openConfirm } from "../ui/confirm-modal.js";
import { onlyMine } from "../utils/scope.js";

let _visits = [];
let _allItems = [];
let _filters = { search: "" };
let _activeSlug = null;

function emptyVisit() {
  const user = auth.currentUser();
  return {
    title: "",
    description: "",
    museumId: _activeSlug,
    createdBy: user?.username || "demo",
    items: [],
  };
}

export async function render() {
  const outlet = document.getElementById("app-outlet");
  _activeSlug = store.activeMuseum.get();

  if (!_activeSlug) {
    const isAuthorWithoutMuseums = auth.isAuthor() && (auth.myMuseumSlugs() || []).length === 0;
    outlet.innerHTML = `
      <div class="aa-empty" style="padding:60px 20px;">
        ${iconHTML(isAuthorWithoutMuseums ? "lock" : "map", { size: 32, color: "var(--t-textMuted)" })}
        <div class="aa-empty__title">${isAuthorWithoutMuseums ? "Nessun museo assegnato" : "Nessun museo selezionato"}</div>
        <div class="aa-empty__msg">${isAuthorWithoutMuseums
          ? "Il tuo account non ha ancora accesso a nessun museo. Chiedi a un amministratore di concederti l'accesso."
          : "Scegli un museo dalla sidebar per gestire le sue visite."}</div>
      </div>
    `;
    return;
  }

  await loadAll();
  renderList();
}

async function loadAll() {
  try {
    [_visits, _allItems] = await Promise.all([
      visitsService.listByMuseum(_activeSlug).catch(() => []),
      itemsService.listByMuseum(_activeSlug).catch(() => []),
    ]);
    _visits = _visits || [];
    _allItems = _allItems || [];

    // Il docente lavora solo sulle proprie visite. Il server le lascia
    // comunque leggere i percorsi pubblici del museo — servono a comporre
    // le tappe — ma qui elencarli darebbe l'impressione di poterli modificare.
    _visits = onlyMine(_visits);
  } catch (err) {
    console.error(err);
    toast("Errore nel caricamento", "danger");
  }
}

function renderList() {
  const outlet = document.getElementById("app-outlet");
  outlet.innerHTML = `
    <div class="aa-vv-page">
      <header class="aa-vv-head">
        <div class="aa-vv-head__row">
          <div>
            <h1 class="aa-vv-title">Visit Editor</h1>
            <p class="aa-vv-sub" id="vv-stats"></p>
          </div>
          <button type="button" class="aa-btn aa-btn--primary" id="vv-new">
            ${iconHTML("plus", { size: 14 })}
            <span>Nuova visita</span>
          </button>
        </div>
        <div class="aa-vv-filters">
          <div class="aa-search" style="flex:1;max-width:360px;">
            <span class="aa-search__icon">${iconHTML("search", { size: 14 })}</span>
            <input type="text" id="vv-search" placeholder="Cerca per titolo o descrizione…" />
          </div>
        </div>
      </header>

      <div class="aa-vv-list" id="vv-list"></div>
    </div>

    <style>
      .aa-vv-page { display:flex; flex-direction:column; height:100%; }
      .aa-vv-head { padding:24px 28px 20px; border-bottom:1px solid var(--t-border); }
      .aa-vv-head__row { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:20px; gap:16px; }
      .aa-vv-title { font-family:var(--t-font-display); font-size:28px; font-weight:600; color:var(--t-text); letter-spacing:-0.01em; }
      .aa-vv-sub { font-size:13px; color:var(--t-textSec); margin-top:4px; }
      .aa-vv-filters { display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap; }
      .aa-vv-list { flex:1; overflow-y:auto; padding:20px 28px; display:flex; flex-direction:column; gap:12px; }

      @media (max-width: 768px) {
        .aa-vv-head { padding:16px 14px; }
        .aa-vv-head__row { flex-direction:column; align-items:stretch; gap:12px; margin-bottom:14px; }
        .aa-vv-title { font-size:22px; }
        .aa-vv-filters > * { flex:1 1 100%; max-width:none !important; }
        .aa-vv-list { padding:14px; }
      }
    </style>
  `;

  document.getElementById("vv-new").addEventListener("click", () => openEditPanel(emptyVisit()));
  document.getElementById("vv-search").addEventListener("input", (e) => {
    _filters.search = e.target.value || "";
    renderCards();
  });
  document.getElementById("vv-list").addEventListener("click", (e) => {
    const card = e.target.closest(".aa-visit-card");
    if (!card) return;
    const action = e.target.closest("[data-action]")?.dataset.action;
    const v = _visits.find((x) => x._id === card.dataset.id);
    if (!v) return;
    if (action === "edit") openEditPanel(v);
    else if (action === "delete") openDeleteConfirm(v);
  });

  renderCards();
}

function applyFilters() {
  return _visits.filter((v) => {
    if (_filters.search) {
      const s = _filters.search.toLowerCase();
      const hay = [v.title, v.description].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(s)) return false;
    }
    return true;
  });
}

function renderCards() {
  const stats = document.getElementById("vv-stats");
  const list = document.getElementById("vv-list");
  if (!stats || !list) return;
  stats.textContent = `${_visits.length} visit${_visits.length === 1 ? "a" : "e"}`;
  const filtered = applyFilters();

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="aa-empty">
        <div class="aa-empty__icon">${iconHTML(_visits.length === 0 ? "visits" : "search", { size: 22 })}</div>
        <div class="aa-empty__title">${_visits.length === 0 ? "Nessuna visita" : "Nessun risultato"}</div>
        <div class="aa-empty__msg">${_visits.length === 0 ? "Crea la prima visita per questo museo aggregando le opere esistenti." : "Prova a modificare i filtri di ricerca."}</div>
      </div>
    `;
    return;
  }
  list.innerHTML = filtered.map(visitCardHTML).join("");
}

function openEditPanel(visit) {
  const outlet = document.getElementById("app-outlet");
  outlet.innerHTML = "";
  const panel = document.createElement("div");
  outlet.appendChild(panel);

  mountVisitEditPanel(panel, {
    data: visit,
    allItems: _allItems,
    onClose: () => renderList(),
    onSave: async (saved) => {
      try {
        let result;
        if (saved._id) {
          result = await visitsService.update(_activeSlug, saved._id, saved);
          const idx = _visits.findIndex((x) => x._id === saved._id);
          if (idx >= 0) _visits[idx] = result;
          toast("Visita aggiornata", "success");
        } else {
          result = await visitsService.create(_activeSlug, saved);
          _visits = [..._visits, result];
          toast("Visita creata", "success");
        }
        renderList();
      } catch (err) {
        console.error(err);
        toast(err.message || "Errore nel salvataggio", "danger");
      }
    },
  });
}

function openDeleteConfirm(visit) {
  openConfirm({
    title: "Elimina visita",
    message: `Sei sicuro di voler eliminare <strong>${escapeHtml(visit.title)}</strong>? L'azione non è reversibile.`,
    confirmLabel: "Elimina",
    danger: true,
    onConfirm: async () => {
      try {
        await visitsService.delete(_activeSlug, visit._id);
        _visits = _visits.filter((x) => x._id !== visit._id);
        toast("Visita eliminata", "success");
        renderCards();
      } catch (err) {
        toast(err.message || "Errore nell'eliminazione", "danger");
      }
    },
  });
}

