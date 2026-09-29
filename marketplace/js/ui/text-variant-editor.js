// ═══════════════════════════════════════════════════════════════
// TEXT VARIANT EDITOR — editor per Item.texts: [{tone, duration, text}].
// ═══════════════════════════════════════════════════════════════

import { TONES, DURATIONS, TONE_LABELS, DURATION_LABELS } from "../utils/schema.js";
import { iconHTML } from "./icon.js";
import { escapeHtml } from "../utils/dom.js";

export function mountTextVariantEditor(target, { value = [], onChange } = {}) {
  let texts = Array.isArray(value) ? value.map((t) => ({ ...t })) : [];
  target.classList.add("aa-tve");

  const optionsHTML = (options, current) =>
    options.map((o) => `<option value="${o.value}" ${o.value === current ? "selected" : ""}>${o.label}</option>`).join("");

  const TONE_OPTS = TONES.map((v) => ({ value: v, label: TONE_LABELS[v] }));
  const DUR_OPTS = DURATIONS.map((v) => ({ value: v, label: DURATION_LABELS[v] }));

  const render = () => {
    target.innerHTML = `
      <div class="aa-tve__head">
        <span class="aa-tve__label">Varianti testo</span>
        <button type="button" class="aa-btn aa-btn--small aa-btn--ghost" data-action="add">
          ${iconHTML("plus", { size: 13 })}
          <span>Aggiungi variante</span>
        </button>
      </div>

      ${texts.length === 0 ? `
        <div class="aa-tve__empty">Nessuna variante. Aggiungine almeno una.</div>
      ` : `
        <div class="aa-tve__list">
          ${texts.map((t, i) => `
            <div class="aa-tve__card" data-card="${i}">
              <div class="aa-tve__row">
                <div class="aa-field">
                  <label class="aa-field__label">Tono</label>
                  <select class="aa-select" data-field="tone">
                    ${optionsHTML(TONE_OPTS, t.tone)}
                  </select>
                </div>
                <div class="aa-field">
                  <label class="aa-field__label">Durata</label>
                  <select class="aa-select" data-field="duration">
                    ${optionsHTML(DUR_OPTS, t.duration)}
                  </select>
                </div>
                ${texts.length > 1 ? `
                  <button type="button" class="aa-tve__remove" data-action="remove" title="Rimuovi">
                    ${iconHTML("close", { size: 14 })}
                  </button>
                ` : ""}
              </div>
              <div class="aa-field">
                <textarea class="aa-textarea" data-field="text" rows="3" placeholder="Descrizione dell'opera per questa variante…">${escapeHtml(t.text || "")}</textarea>
              </div>
            </div>
          `).join("")}
        </div>
      `}
    `;
  };

  // Click handlers
  target.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "add") {
      texts = [...texts, { tone: "medio", duration: "medio", text: "" }];
      onChange?.(texts);
      render();
    } else if (action === "remove") {
      const card = e.target.closest("[data-card]");
      if (card) {
        const i = parseInt(card.dataset.card, 10);
        texts = texts.filter((_, idx) => idx !== i);
        onChange?.(texts);
        render();
      }
    }
  });

  // Field changes (select)
  target.addEventListener("change", (e) => {
    const card = e.target.closest("[data-card]");
    if (!card) return;
    const i = parseInt(card.dataset.card, 10);
    const field = e.target.dataset.field;
    if (!field) return;
    texts = texts.map((t, idx) => idx === i ? { ...t, [field]: e.target.value } : t);
    onChange?.(texts);
  });

  // Live input on textarea
  target.addEventListener("input", (e) => {
    if (e.target.tagName !== "TEXTAREA") return;
    const card = e.target.closest("[data-card]");
    if (!card) return;
    const i = parseInt(card.dataset.card, 10);
    texts = texts.map((t, idx) => idx === i ? { ...t, text: e.target.value } : t);
    onChange?.(texts);
  });

  render();

  return {
    get value() { return texts; },
    setValue(arr) {
      texts = Array.isArray(arr) ? arr.map((t) => ({ ...t })) : [];
      render();
    },
  };
}
