// ═══════════════════════════════════════════════════════════════
// VISIT CARD — render HTML di una card visita.
// ═══════════════════════════════════════════════════════════════

import { escapeHtml } from "../utils/dom.js";
import { iconHTML } from "./icon.js";

export function visitCardHTML(v) {
  const stops = v.items || [];
  return `
    <div class="aa-visit-card" data-id="${escapeHtml(v._id || '')}">
      <div class="aa-visit-card__row">
        <div class="aa-visit-card__body">
          <div class="aa-visit-card__title-row">
            <span class="aa-visit-card__title">${escapeHtml(v.title || "Senza titolo")}</span>
          </div>
          ${v.description ? `<div class="aa-visit-card__desc">${escapeHtml(v.description)}</div>` : ""}
          <div class="aa-visit-card__stats">
            <span>${stops.length} tappa/e</span>
          </div>
        </div>
        <div class="aa-card-actions">
          <button type="button" class="aa-icon-btn" data-action="edit" title="Modifica">
            ${iconHTML("edit", { size: 14 })}
          </button>
          <button type="button" class="aa-icon-btn aa-icon-btn--danger" data-action="delete" title="Elimina">
            ${iconHTML("trash", { size: 13 })}
          </button>
        </div>
      </div>
    </div>
  `;
}
