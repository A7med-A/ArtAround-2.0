// ═══════════════════════════════════════════════════════════════
// ITEM PICKER MODAL — multi-select di item per aggiungere tappe.
// ═══════════════════════════════════════════════════════════════

import { iconHTML } from "./icon.js";
import { openModal } from "./modal.js";
import { escapeHtml } from "../utils/dom.js";

/**
 * @param {object} opts
 * @param {object[]} opts.items
 * @param {string[]} [opts.excludeIds]
 * @param {(ids: string[]) => void} opts.onPicked
 */
export function openItemPickerModal({ items, excludeIds = [], onPicked }) {
  const exclude = new Set(excludeIds);
  const selected = new Set();
  let search = "";

  const m = openModal({ title: "Aggiungi tappe", width: 640 });

  m.body.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px;min-height:320px;">
      <div style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;">
        <div class="aa-search" style="flex:1;min-width:200px;">
          <span class="aa-search__icon">${iconHTML("search", { size: 14 })}</span>
          <input type="text" placeholder="Cerca per titolo, artista, tag…" data-search />
        </div>
        <span class="aa-counter" style="font-size:12px;color:var(--t-textSec);font-family:var(--t-font-mono);"></span>
      </div>
      <div class="aa-picker-list" style="display:flex;flex-direction:column;gap:6px;max-height:400px;overflow-y:auto;padding-right:4px;"></div>
    </div>
    <div class="aa-modal-footer">
      <button type="button" class="aa-btn" data-action="cancel">Annulla</button>
      <button type="button" class="aa-btn aa-btn--primary" data-action="confirm">
        ${iconHTML("plus", { size: 14 })}
        <span>Aggiungi selezionati</span>
      </button>
    </div>
  `;

  const list = m.body.querySelector(".aa-picker-list");
  const counter = m.body.querySelector(".aa-counter");

  const available = () => items.filter((it) => !exclude.has(it._id));

  const filtered = () => {
    const all = available();
    if (!search) return all;
    const s = search.toLowerCase();
    return all.filter((it) => {
      const hay = [it.title, it.artist, it.period, ...(it.tags || [])]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(s);
    });
  };

  const renderList = () => {
    const f = filtered();
    counter.textContent = `${selected.size} selezionati su ${available().length} disponibili`;
    if (f.length === 0) {
      const empty = available().length === 0;
      list.innerHTML = `<div class="aa-empty"><div class="aa-empty__msg">${empty ? "Tutti gli item del museo sono già presenti nella visita." : "Nessun item corrisponde alla ricerca."}</div></div>`;
      return;
    }
    list.innerHTML = f.map((it) => {
      const checked = selected.has(it._id);
      const variantsCount = (it.texts || []).length;
      return `
        <div class="aa-picker-item ${checked ? 'is-checked' : ''}"
             data-id="${escapeHtml(it._id)}"
             style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:6px;background:${checked ? 'var(--t-goldBg)' : 'var(--t-surfaceEl)'};border:1px solid ${checked ? 'var(--t-goldDim)' : 'var(--t-border)'};cursor:pointer;transition:all var(--t-transition);">
          <div style="width:18px;height:18px;border-radius:4px;border:1.5px solid ${checked ? 'var(--t-gold)' : 'var(--t-border)'};background:${checked ? 'var(--t-gold)' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            ${checked ? iconHTML("check", { size: 11, color: "var(--t-bg)" }) : ""}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-family:var(--t-font-display);font-size:14px;font-weight:600;color:${checked ? 'var(--t-gold)' : 'var(--t-text)'};">${escapeHtml(it.title || "—")}</div>
            <div style="font-size:11px;color:var(--t-textMuted);margin-top:2px;">${escapeHtml(it.artist || "—")} · ${escapeHtml(it.period || "—")}</div>
          </div>
          <div style="display:flex;gap:4px;flex-shrink:0;">
            ${variantsCount > 0 ? `<span class="aa-badge aa-badge--gold">${variantsCount}v</span>` : ""}
          </div>
        </div>
      `;
    }).join("");
  };

  // Wire events
  m.body.querySelector("[data-search]").addEventListener("input", (e) => {
    search = e.target.value || "";
    renderList();
  });

  list.addEventListener("click", (e) => {
    const row = e.target.closest("[data-id]");
    if (!row) return;
    const id = row.dataset.id;
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    renderList();
  });

  m.body.querySelector("[data-action='cancel']").addEventListener("click", () => m.close());
  m.body.querySelector("[data-action='confirm']").addEventListener("click", () => {
    onPicked?.(Array.from(selected));
    m.close();
  });

  renderList();
}
