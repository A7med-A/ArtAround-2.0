// ═══════════════════════════════════════════════════════════════
// STOP ROW — riga "tappa" nell'editor di una visita.
// ═══════════════════════════════════════════════════════════════

import { TONE_LABELS, DURATION_LABELS } from "../utils/schema.js";
import { escapeHtml } from "../utils/dom.js";
import { iconHTML } from "./icon.js";

export function stopRowHTML({ item, index, total }) {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const variants = (item.texts || []).slice(0, 3);
  return `
    <div class="aa-stop-row" data-index="${index}">
      <div class="aa-stop-row__num">${index + 1}</div>
      <div class="aa-stop-row__body">
        <div class="aa-stop-row__title-row">
          <span class="aa-stop-row__title">${escapeHtml(item.title || "—")}</span>
          ${(item.texts || []).length > 0
            ? `<span class="aa-badge aa-badge--gold">${item.texts.length} variant${item.texts.length > 1 ? "i" : "e"}</span>`
            : ""}
        </div>
        <div class="aa-stop-row__meta">
          ${escapeHtml(item.artist || "—")} · ${escapeHtml(item.period || "—")}
        </div>
        ${variants.length > 0 ? `
          <div class="aa-variants" style="margin-top:4px;">
            ${variants.map((v) => `
              <span class="aa-variant">${TONE_LABELS[v.tone] || v.tone} · ${DURATION_LABELS[v.duration] || v.duration}</span>
            `).join("")}
            ${item.texts.length > 3 ? `<span class="aa-variant">+${item.texts.length - 3}</span>` : ""}
          </div>
        ` : ""}
      </div>
      <div class="aa-card-actions">
        <button type="button" class="aa-icon-btn" data-action="up" ${isFirst ? "disabled" : ""} title="Sposta su">
          ${iconHTML("arrowUp", { size: 14 })}
        </button>
        <button type="button" class="aa-icon-btn" data-action="down" ${isLast ? "disabled" : ""} title="Sposta giù">
          ${iconHTML("arrowDown", { size: 14 })}
        </button>
        <button type="button" class="aa-icon-btn aa-icon-btn--danger" data-action="remove" title="Rimuovi tappa">
          ${iconHTML("trash", { size: 13 })}
        </button>
      </div>
    </div>
  `;
}
