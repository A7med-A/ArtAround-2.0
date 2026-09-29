// ═══════════════════════════════════════════════════════════════
// ITEMS VIEW — Item Manager
// ═══════════════════════════════════════════════════════════════

import { store } from "../core/store.js";
import { auth } from "../core/auth.js";
import { itemsService } from "../services/items.service.js";
import { TONES, TONE_LABELS } from "../utils/schema.js";
import { emptyItem } from "../utils/validators.js";
import { toast } from "../ui/toast.js";
import { escapeHtml } from "../utils/dom.js";
import { iconHTML } from "../ui/icon.js";
import { itemCardHTML } from "../ui/item-card.js";
import { openItemEditModal } from "../ui/item-edit-modal.js";
import { openConfirm } from "../ui/confirm-modal.js";
import { canEdit } from "../utils/scope.js";

let _items = [];
let _filters = { search: "", tone: "all" };
let _activeSlug = null;

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
          : "Scegli un museo dalla sidebar per gestire i suoi contenuti."}</div>
      </div>
    `;
    return;
  }

  outlet.innerHTML = `
    <div class="aa-iv-page">
      <header class="aa-iv-head">
        <div class="aa-iv-head__row">
          <div>
            <h1 class="aa-iv-title">Item Manager</h1>
            <p class="aa-iv-sub" id="iv-stats">Caricamento…</p>
          </div>
          <button type="button" class="aa-btn aa-btn--primary" id="iv-new">
            ${iconHTML("plus", { size: 14 })}
            <span>Nuova opera</span>
          </button>
        </div>
        <div class="aa-iv-filters">
          <div class="aa-search" style="flex:1;max-width:360px;">
            <span class="aa-search__icon">${iconHTML("search", { size: 14 })}</span>
            <input type="text" id="iv-search" placeholder="Cerca per titolo, artista, tag…" />
          </div>
          <select class="aa-select" id="iv-tone" style="width:auto;">
            <option value="all">Tutti i toni</option>
            ${TONES.map((v) => `<option value="${v}">${TONE_LABELS[v]}</option>`).join("")}
          </select>
        </div>
      </header>
      <div class="aa-iv-list" id="iv-list">
        <div style="display:flex;justify-content:center;padding:60px;"><div class="aa-spinner"></div></div>
      </div>
    </div>

    <style>
      .aa-iv-page { display:flex; flex-direction:column; height:100%; }
      .aa-iv-head { padding:24px 28px 20px; border-bottom:1px solid var(--t-border); }
      .aa-iv-head__row { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:20px; gap:16px; }
      .aa-iv-title { font-family:var(--t-font-display); font-size:28px; font-weight:600; color:var(--t-text); letter-spacing:-0.01em; }
      .aa-iv-sub { font-size:13px; color:var(--t-textSec); margin-top:4px; }
      .aa-iv-filters { display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap; }
      .aa-iv-list { flex:1; overflow-y:auto; padding:20px 28px; display:flex; flex-direction:column; gap:10px; }

      @media (max-width: 768px) {
        .aa-iv-head { padding:16px 14px; }
        .aa-iv-head__row { flex-direction:column; align-items:stretch; gap:12px; margin-bottom:14px; }
        .aa-iv-title { font-size:22px; }
        .aa-iv-filters > * { flex:1 1 100%; max-width:none !important; }
        .aa-iv-list { padding:14px; }
      }
    </style>
  `;

  // Listeners
  document.getElementById("iv-new").addEventListener("click", () => openNew());
  document.getElementById("iv-search").addEventListener("input", (e) => {
    _filters.search = e.target.value || "";
    renderList();
  });
  document.getElementById("iv-tone").addEventListener("change", (e) => {
    _filters.tone = e.target.value;
    renderList();
  });

  // Card actions delegation
  document.getElementById("iv-list").addEventListener("click", (e) => {
    const card = e.target.closest(".aa-item-card");
    if (!card) return;
    const action = e.target.closest("[data-action]")?.dataset.action;
    const it = _items.find((x) => x._id === card.dataset.id);
    if (!it) return;
    if (action === "edit") openEdit(it);
    else if (action === "delete") openDelete(it);
  });

  await loadItems();
}

async function loadItems() {
  try {
    // Tutte le opere del museo, comprese quelle che l'utente non può
    // modificare: servono a consultarle e a comporre le visite. Chi può
    // modificare cosa lo decide la card, non questa lista.
    _items = (await itemsService.listByMuseum(_activeSlug)) || [];
  } catch (err) {
    _items = [];
    console.error("Errore caricamento items:", err);
    toast("Errore nel caricamento degli item", "danger");
  }
  renderList();
}

function applyFilters() {
  return _items.filter((it) => {
    if (_filters.search) {
      const s = _filters.search.toLowerCase();
      const hay = [it.title, it.artist, it.period, it.description, ...(it.tags || [])]
        .filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(s)) return false;
    }
    if (_filters.tone !== "all") {
      const hasTone = (it.texts || []).some((t) => t.tone === _filters.tone);
      if (!hasTone) return false;
    }
    return true;
  });
}

function renderList() {
  const container = document.getElementById("iv-list");
  const stats = document.getElementById("iv-stats");
  if (!container || !stats) return;

  stats.textContent = `${_items.length} ${_items.length === 1 ? "contenuto" : "contenuti"}`;
  const filtered = applyFilters();

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="aa-empty">
        <div class="aa-empty__icon">${iconHTML(_items.length === 0 ? "items" : "search", { size: 22 })}</div>
        <div class="aa-empty__title">${_items.length === 0 ? "Nessuna opera" : "Nessun risultato"}</div>
        <div class="aa-empty__msg">${_items.length === 0 ? "Inizia creando la prima opera per questo museo." : "Prova a modificare i filtri di ricerca."}</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map((it) => itemCardHTML(it, { readOnly: !canEdit(it) }))
    .join("");
}

function openNew() {
  const user = auth.currentUser();
  openItemEditModal({
    data: emptyItem(_activeSlug, user?.username || "demo"),
    onSave: async (saved) => {
      try {
        const result = await itemsService.create(_activeSlug, saved);
        _items = [..._items, result];
        toast("Opera creata", "success");
        renderList();
        return true;
      } catch (err) {
        console.error(err);
        toast(err.message || "Errore nel salvataggio", "danger");
        return false;
      }
    },
  });
}

function openEdit(item) {
  openItemEditModal({
    data: item,
    onSave: async (saved) => {
      try {
        const result = await itemsService.update(_activeSlug, saved._id, saved);
        const idx = _items.findIndex((x) => x._id === saved._id);
        if (idx >= 0) _items[idx] = result;
        toast("Opera aggiornata", "success");
        renderList();
        return true;
      } catch (err) {
        console.error(err);
        toast(err.message || "Errore nel salvataggio", "danger");
        return false;
      }
    },
  });
}

function openDelete(item) {
  openConfirm({
    title: "Elimina opera",
    message: `Sei sicuro di voler eliminare <strong>${escapeHtml(item.title)}</strong>? L'azione non è reversibile.`,
    confirmLabel: "Elimina",
    danger: true,
    onConfirm: async () => {
      try {
        await itemsService.delete(_activeSlug, item._id);
        _items = _items.filter((x) => x._id !== item._id);
        toast("Opera eliminata", "success");
        renderList();
      } catch (err) {
        console.error(err);
        toast(err.message || "Errore nell'eliminazione", "danger");
      }
    },
  });
}

