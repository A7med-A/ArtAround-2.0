// ═══════════════════════════════════════════════════════════════
// MAP TOOLBAR — tools, undo/redo, zoom, save.
// ═══════════════════════════════════════════════════════════════

import { TOOLS } from "../utils/map.js";
import { iconHTML } from "./icon.js";

/**
 * Monta la toolbar nel target.
 * @param {HTMLElement} target
 * @param {object} state
 * @param {object} handlers
 */
export function mountMapToolbar(target, { activeTool = "select", zoom = 1, canUndo = false, canRedo = false, dirty = false } = {}, handlers = {}) {
  target.classList.add("aa-map-toolbar");

  const render = (s) => {
    const zoomPct = Math.round(s.zoom * 100);
    target.innerHTML = `
      <div class="aa-map-toolbar__group">
        ${TOOLS.map((t) => `
          <button type="button" class="aa-map-toolbar__tool ${t.id === s.activeTool ? 'is-active' : ''}" data-tool="${t.id}" title="${t.label}">
            ${iconHTML(t.icon, { size: 13 })}
            <span>${t.label}</span>
          </button>
        `).join("")}
      </div>

      <div class="aa-map-toolbar__vsep"></div>

      <div style="display:flex;align-items:center;gap:2px;">
        <button type="button" class="aa-icon-btn" data-action="undo" ${s.canUndo ? "" : "disabled"} title="Annulla (Cmd+Z)">
          ${iconHTML("arrowDown", { size: 14, className: "aa-rot-90" })}
        </button>
        <button type="button" class="aa-icon-btn" data-action="redo" ${s.canRedo ? "" : "disabled"} title="Ripeti (Cmd+Shift+Z)">
          ${iconHTML("arrowDown", { size: 14, className: "aa-rot-neg-90" })}
        </button>
      </div>

      <div class="aa-map-toolbar__vsep"></div>

      <div style="display:flex;align-items:center;gap:2px;">
        <button type="button" class="aa-icon-btn" data-action="zoom-out" title="Zoom out">
          ${iconHTML("zoomOut", { size: 14 })}
        </button>
        <span class="aa-map-toolbar__zoom-pct">${zoomPct}%</span>
        <button type="button" class="aa-icon-btn" data-action="zoom-in" title="Zoom in">
          ${iconHTML("zoomIn", { size: 14 })}
        </button>
        <button type="button" class="aa-icon-btn" data-action="zoom-reset" title="Reset zoom">
          ${iconHTML("move", { size: 14 })}
        </button>
      </div>

      <div class="aa-map-toolbar__right">
        ${s.dirty ? `<span class="aa-dirty-dot" title="Modifiche non salvate"></span>` : ""}
        <button type="button" class="aa-btn aa-btn--small ${s.dirty ? 'aa-btn--primary' : ''}" data-action="save">
          ${iconHTML("save", { size: 14 })}
          <span>Salva mappa</span>
        </button>
      </div>
    `;
  };

  let state = { activeTool, zoom, canUndo, canRedo, dirty };
  render(state);

  target.addEventListener("click", (e) => {
    const tool = e.target.closest("[data-tool]")?.dataset.tool;
    if (tool) return handlers.onToolChange?.(tool);
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action) return handlers[`on${capitalize(toCamel(action))}`]?.();
  });

  return {
    update(partial) {
      state = { ...state, ...partial };
      render(state);
    },
  };
}

function toCamel(s) { return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); }
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
