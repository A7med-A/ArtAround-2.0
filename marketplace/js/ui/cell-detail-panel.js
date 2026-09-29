// ═══════════════════════════════════════════════════════════════
// CELL DETAIL PANEL — pannello laterale destro del Map Editor.
// ═══════════════════════════════════════════════════════════════

import { CELL_STYLES, getCell, countByType, clampDim } from "../utils/map.js";
import { CELL_LABELS } from "../utils/schema.js";
import { escapeHtml } from "../utils/dom.js";
import { iconHTML } from "./icon.js";

export function mountCellDetailPanel(target, { floor = null, selectedCell = null, allItems = [] } = {}, handlers = {}) {
  let state = { floor, selectedCell, allItems };
  target.classList.add("aa-cell-panel");

  const detailHTML = () => {
    if (!state.selectedCell || !state.floor) {
      return `
        <div class="aa-empty">
          ${iconHTML("move", { size: 20, color: "var(--t-textMuted)" })}
          <p style="font-size:12px;color:var(--t-textMuted);margin:0;">Seleziona una cella per vederne i dettagli</p>
        </div>
      `;
    }
    const cell = getCell(state.floor.cells, state.selectedCell.x, state.selectedCell.y);
    if (!cell) {
      return `
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div class="aa-cell-coord">
            <span>X</span><strong>${state.selectedCell.x}</strong>
            <span>Y</span><strong>${state.selectedCell.y}</strong>
          </div>
          <div class="aa-cell-empty">
            <p>Cella vuota</p>
            <p style="font-size:11px;color:var(--t-textMuted);margin-top:4px;">Seleziona uno strumento e clicca per riempirla.</p>
          </div>
        </div>
      `;
    }
    const style = CELL_STYLES[cell.type];
    const itemOptions = [
      `<option value="">— Nessun item —</option>`,
      ...state.allItems.map((it) => `<option value="${escapeHtml(it._id)}" ${it._id === cell.itemId ? 'selected' : ''}>${escapeHtml(it.title || "(senza titolo)")}</option>`),
    ].join("");
    const showItemSelector = cell.type === "item";

    return `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="aa-cell-coord">
          <span>X</span><strong>${cell.x}</strong>
          <span>Y</span><strong>${cell.y}</strong>
        </div>
        <div>
          <span class="aa-type-chip" style="background:${style.bg};border-color:${style.border};">
            ${style.icon ? iconHTML(style.icon, { size: 14, color: style.iconColor }) : ""}
            <span>${CELL_LABELS[cell.type]}</span>
          </span>
        </div>
        ${showItemSelector ? `
          <div class="aa-field">
            <label class="aa-field__label">Item collegato</label>
            <select class="aa-select" data-field="itemId">${itemOptions}</select>
          </div>
          ${!cell.itemId ? `<div class="aa-cell-warn">⚠ Ogni cella "Opera" deve essere collegata a un item per essere salvata.</div>` : ""}
        ` : ""}
        <button type="button" class="aa-btn aa-btn--small aa-btn--danger" data-action="clear">
          ${iconHTML("trash", { size: 13 })}
          <span>Rimuovi cella</span>
        </button>
      </div>
    `;
  };

  const dimensionsHTML = () => {
    if (!state.floor) return "";
    return `
      <div>
        <div class="aa-cell-panel__title">Dimensioni piano</div>
        <div class="aa-dims-row">
          <label class="aa-dims-field">
            <span>Larghezza</span>
            <input type="number" class="aa-dims-input" data-dim="width" min="1" max="100" step="1" value="${state.floor.width}" />
          </label>
          <span class="aa-dims-sep">×</span>
          <label class="aa-dims-field">
            <span>Altezza</span>
            <input type="number" class="aa-dims-input" data-dim="height" min="1" max="100" step="1" value="${state.floor.height}" />
          </label>
        </div>
        <button type="button" class="aa-btn aa-btn--small aa-btn--primary" data-action="resize">
          <span>Applica dimensioni</span>
        </button>
        <p style="font-size:11px;color:var(--t-textMuted);margin:6px 0 0;line-height:1.4;">Range 1–100. Le celle fuori dai nuovi limiti verranno rimosse.</p>
      </div>
    `;
  };

  const legendHTML = () => {
    if (!state.floor) return "";
    const counts = countByType(state.floor.cells);
    return `
      <div class="aa-legend">
        <div class="aa-cell-panel__title">Legenda</div>
        ${Object.keys(CELL_STYLES).map((type) => {
          const s = CELL_STYLES[type];
          return `
            <div class="aa-legend-row">
              <div class="aa-legend-box" style="background:${s.bg};border-color:${s.border};"></div>
              <span class="aa-legend-label">${CELL_LABELS[type]}</span>
              <span class="aa-legend-count">${counts[type]}</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  };

  const minimapHTML = () => {
    if (!state.floor) return "";
    const { width, height, cells = [] } = state.floor;
    const W = 180, H = 130;
    const cw = W / width, ch = H / height;
    const rects = cells.map((c) => {
      const fill = CELL_STYLES[c.type]?.bg || "var(--t-border)";
      return `<rect x="${c.x * cw}" y="${c.y * ch}" width="${cw}" height="${ch}" fill="${fill}" />`;
    }).join("");
    return `
      <div>
        <div class="aa-cell-panel__title">Anteprima piano</div>
        <svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet"
             style="background:var(--t-gridBg);border:1px solid var(--t-border);border-radius:4px;">
          ${rects}
        </svg>
        <div class="aa-minimap__caption">${width} × ${height} celle</div>
      </div>
    `;
  };

  const render = () => {
    target.innerHTML = `
      <div class="aa-cell-panel__panel">
        <div class="aa-cell-panel__title">Dettaglio cella</div>
        ${detailHTML()}
      </div>
      <div class="aa-cell-panel__panel">${dimensionsHTML()}</div>
      <div class="aa-cell-panel__panel">${legendHTML()}</div>
      <div class="aa-cell-panel__panel">${minimapHTML()}</div>
    `;
  };

  target.addEventListener("change", (e) => {
    if (!state.selectedCell) return;
    const field = e.target.dataset.field;
    if (!field) return;
    handlers.onCellUpdate?.({
      x: state.selectedCell.x,
      y: state.selectedCell.y,
      patch: { [field]: e.target.value },
    });
  });

  target.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "clear" && state.selectedCell) {
      handlers.onCellClear?.(state.selectedCell);
    } else if (action === "resize" && state.floor) {
      const w = clampDim(target.querySelector('[data-dim="width"]')?.value);
      const h = clampDim(target.querySelector('[data-dim="height"]')?.value);
      if (w === state.floor.width && h === state.floor.height) return;
      handlers.onFloorResize?.({ width: w, height: h });
    }
  });

  render();

  return {
    update(partial) {
      state = { ...state, ...partial };
      render();
    },
  };
}
