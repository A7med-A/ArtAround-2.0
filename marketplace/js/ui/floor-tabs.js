// ═══════════════════════════════════════════════════════════════
// FLOOR TABS — tab dei piani con add/remove/rename.
// ═══════════════════════════════════════════════════════════════

import { countByType } from "../utils/map.js";
import { escapeHtml } from "../utils/dom.js";
import { iconHTML } from "./icon.js";

export function mountFloorTabs(target, { floors = [], activeIndex = 0 } = {}, handlers = {}) {
  target.classList.add("aa-floor-tabs");

  const render = (s) => {
    target.innerHTML = `
      ${s.floors.map((f, i) => {
        const counts = countByType(f.cells);
        const isActive = i === s.activeIndex;
        const canRemove = s.floors.length > 1;
        return `
          <div class="aa-floor-tab ${isActive ? 'is-active' : ''}" data-tab="${i}" title="Doppio click per rinominare">
            <span class="aa-floor-tab__order">P${f.order}</span>
            <span class="aa-floor-tab__name">${escapeHtml(f.name)}</span>
            <span class="aa-floor-tab__count">${counts.item} opere</span>
            ${canRemove ? `
              <button type="button" class="aa-floor-tab__remove" data-remove="${i}" title="Rimuovi piano">
                ${iconHTML("close", { size: 11 })}
              </button>
            ` : ""}
          </div>
        `;
      }).join("")}
      <button type="button" class="aa-floor-tab--add" data-add title="Aggiungi piano">
        ${iconHTML("plus", { size: 13 })}
        <span>Piano</span>
      </button>
    `;
  };

  let state = { floors, activeIndex };
  render(state);

  target.addEventListener("click", (e) => {
    const removeBtn = e.target.closest("[data-remove]");
    if (removeBtn) {
      e.stopPropagation();
      return handlers.onFloorRemove?.(parseInt(removeBtn.dataset.remove, 10));
    }
    if (e.target.closest("[data-add]")) {
      return handlers.onFloorAdd?.();
    }
    const tab = e.target.closest("[data-tab]");
    if (tab) return handlers.onFloorSelect?.(parseInt(tab.dataset.tab, 10));
  });

  // Doppio click su nome → rinomina
  target.addEventListener("dblclick", (e) => {
    const nameEl = e.target.closest(".aa-floor-tab__name");
    if (!nameEl) return;
    const tab = nameEl.closest("[data-tab]");
    if (!tab) return;
    const idx = parseInt(tab.dataset.tab, 10);
    const current = state.floors[idx]?.name || "";
    const next = prompt("Nome del piano:", current);
    if (next && next.trim() && next !== current) {
      handlers.onFloorRename?.(idx, next.trim());
    }
  });

  return {
    update(partial) {
      state = { ...state, ...partial };
      render(state);
    },
  };
}
