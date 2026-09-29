// ═══════════════════════════════════════════════════════════════
// ITEM CARD — render HTML di una card item.
// ═══════════════════════════════════════════════════════════════

import { TONE_LABELS, DURATION_LABELS } from "../utils/schema.js";
import { escapeHtml } from "../utils/dom.js";
import { iconHTML } from "./icon.js";

/**
 * Ritorna l'HTML di una card item. La card ha attributi data-id e
 * data-action sui bottoni; il caller installa i listener via delegation.
 *
 * @param {object} it
 * @param {{ readOnly?: boolean }} opts  con `readOnly` la card è consultabile
 *   ma non modificabile: è il caso delle opere del museo viste da un docente,
 *   che deve poterle leggere e inserire nelle proprie visite senza toccarle.
 */
export function itemCardHTML(it, { readOnly = false } = {}) {
  const tags = it.tags || [];
  const texts = it.texts || [];
  return `
    <article class="aa-item-card${readOnly ? " is-readonly" : ""}" data-id="${escapeHtml(it._id || '')}">
      <div class="aa-item-card__inner">
        <div class="aa-item-card__row">
          <div class="aa-item-card__thumb" style="${it.imageUrl ? `background-image:url('${escapeHtml(it.imageUrl)}')` : ''}">
            ${!it.imageUrl ? iconHTML("artwork", { size: 22, color: "var(--t-textMuted)" }) : ""}
          </div>

          <div class="aa-item-card__body">
            <div class="aa-item-card__title-row">
              <span class="aa-item-card__title">${escapeHtml(it.title)}</span>
              ${it.license ? `<span class="aa-badge aa-badge--gold">${escapeHtml(it.license)}</span>` : ""}
            </div>

            <div class="aa-item-card__meta">
              <strong>${escapeHtml(it.artist || "—")}</strong>
              ${it.period ? ` · ${escapeHtml(it.period)}` : ""}
            </div>

            ${tags.length > 0 ? `
              <div class="aa-tags">
                ${tags.map((t) => `<span class="aa-tag">${escapeHtml(t)}</span>`).join("")}
              </div>
            ` : ""}

            <div class="aa-variants">
              ${texts.length > 0
                ? texts.map((t) => `
                    <span class="aa-variant">
                      <strong>${TONE_LABELS[t.tone] || t.tone}</strong>
                      <span>·</span>
                      <span>${DURATION_LABELS[t.duration] || t.duration}</span>
                    </span>
                  `).join("")
                : `<span class="aa-variant" style="color:var(--t-textMuted)">Nessuna variante</span>`}
            </div>
          </div>

          <div class="aa-card-actions">
            ${readOnly ? `
              <span class="aa-readonly-tag" title="Opera del museo: puoi usarla nelle tue visite, non modificarla">
                ${iconHTML("lock", { size: 12 })}
                <span>Del museo</span>
              </span>
            ` : `
              <button type="button" class="aa-icon-btn" data-action="edit" title="Modifica">
                ${iconHTML("edit", { size: 14 })}
              </button>
              <button type="button" class="aa-icon-btn aa-icon-btn--danger" data-action="delete" title="Elimina">
                ${iconHTML("trash", { size: 13 })}
              </button>
            `}
          </div>
        </div>
      </div>
    </article>
  `;
}
