// ═══════════════════════════════════════════════════════════════
// QUIZ EDITOR — editor per Visit.quiz: [{ text, options[], correctIndex }].
//
// Serve alle visite guidate: il docente prepara qui le domande che
// somministrerà alla classe a fine visita dal Navigator.
// Stessa forma degli altri editor: mountXxx(target, opts) → { update }.
// ═══════════════════════════════════════════════════════════════

import { iconHTML } from "./icon.js";
import { escapeHtml } from "../utils/dom.js";

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

const emptyQuestion = () => ({ text: "", options: ["", ""], correctIndex: 0 });

/**
 * @param {HTMLElement} target
 * @param {{ value: object[], onChange: (quiz) => void }} opts
 */
export function mountQuizEditor(target, { value = [], onChange } = {}) {
  let quiz = Array.isArray(value) ? value.map((q) => ({ ...q, options: [...(q.options || [])] })) : [];
  target.classList.add("aa-quiz");

  const emit = () => onChange?.(quiz);

  const render = () => {
    target.innerHTML = `
      <div class="aa-quiz__head">
        <div>
          <span class="aa-quiz__label">Quiz finale</span>
          <p class="aa-quiz__hint">
            Domande a scelta multipla proposte alla classe a fine visita.
            Segna la risposta corretta: il punteggio si calcola da sola.
          </p>
        </div>
        <button type="button" class="aa-btn aa-btn--small aa-btn--ghost" data-action="add-question">
          ${iconHTML("plus", { size: 13 })}
          <span>Aggiungi domanda</span>
        </button>
      </div>

      ${quiz.length === 0 ? `
        <div class="aa-quiz__empty">
          Nessuna domanda. Una visita guidata può funzionare anche senza quiz.
        </div>
      ` : `
        <div class="aa-quiz__list">
          ${quiz.map((q, qi) => `
            <div class="aa-quiz__card" data-question="${qi}">
              <div class="aa-quiz__card-head">
                <span class="aa-quiz__number">${qi + 1}</span>
                <input class="aa-input" type="text" data-field="text"
                  value="${escapeHtml(q.text || "")}"
                  placeholder="Scrivi la domanda…" />
                <button type="button" class="aa-icon-btn" data-action="remove-question" title="Elimina domanda">
                  ${iconHTML("trash", { size: 14 })}
                </button>
              </div>

              <div class="aa-quiz__options">
                ${(q.options || []).map((opt, oi) => `
                  <div class="aa-quiz__option ${oi === q.correctIndex ? "is-correct" : ""}" data-option="${oi}">
                    <button type="button" class="aa-quiz__pick" data-action="set-correct"
                      title="${oi === q.correctIndex ? "Risposta corretta" : "Segna come corretta"}"
                      aria-pressed="${oi === q.correctIndex}">
                      ${oi === q.correctIndex ? iconHTML("check", { size: 13 }) : LETTERS[oi]}
                    </button>
                    <input class="aa-input" type="text" data-field="option"
                      value="${escapeHtml(opt || "")}"
                      placeholder="Risposta ${LETTERS[oi]}" />
                    <button type="button" class="aa-icon-btn" data-action="remove-option"
                      title="Elimina risposta" ${(q.options || []).length <= MIN_OPTIONS ? "disabled" : ""}>
                      ${iconHTML("close", { size: 13 })}
                    </button>
                  </div>
                `).join("")}
              </div>

              ${(q.options || []).length < MAX_OPTIONS ? `
                <button type="button" class="aa-btn aa-btn--small aa-btn--ghost" data-action="add-option">
                  ${iconHTML("plus", { size: 12 })}
                  <span>Aggiungi risposta</span>
                </button>
              ` : ""}
            </div>
          `).join("")}
        </div>
      `}
    `;
  };

  // ── Modifiche ai testi ─────────────────────────────────────────
  // Delegato: gli input vengono ricreati a ogni render.
  target.addEventListener("input", (e) => {
    const field = e.target.dataset.field;
    if (!field) return;
    const qi = Number(e.target.closest("[data-question]")?.dataset.question);
    if (Number.isNaN(qi)) return;

    if (field === "text") {
      quiz[qi].text = e.target.value;
    } else if (field === "option") {
      const oi = Number(e.target.closest("[data-option]")?.dataset.option);
      if (Number.isNaN(oi)) return;
      quiz[qi].options[oi] = e.target.value;
    }
    // Nessun re-render: sposterebbe il cursore mentre si scrive.
    emit();
  });

  // ── Azioni ─────────────────────────────────────────────────────
  target.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const qi = Number(btn.closest("[data-question]")?.dataset.question);
    const oi = Number(btn.closest("[data-option]")?.dataset.option);

    if (action === "add-question") {
      quiz = [...quiz, emptyQuestion()];
    } else if (action === "remove-question") {
      quiz = quiz.filter((_, i) => i !== qi);
    } else if (action === "add-option") {
      if (quiz[qi].options.length >= MAX_OPTIONS) return;
      quiz[qi].options = [...quiz[qi].options, ""];
    } else if (action === "remove-option") {
      if (quiz[qi].options.length <= MIN_OPTIONS) return;
      quiz[qi].options = quiz[qi].options.filter((_, i) => i !== oi);
      // La risposta corretta segue lo spostamento delle opzioni rimaste.
      if (quiz[qi].correctIndex === oi) quiz[qi].correctIndex = 0;
      else if (quiz[qi].correctIndex > oi) quiz[qi].correctIndex -= 1;
    } else if (action === "set-correct") {
      quiz[qi].correctIndex = oi;
    } else {
      return;
    }

    render();
    emit();
  });

  render();
  return {
    update(next) {
      quiz = Array.isArray(next) ? next.map((q) => ({ ...q, options: [...(q.options || [])] })) : [];
      render();
    },
    value: () => quiz,
  };
}

/**
 * Verifica che un quiz sia somministrabile.
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateQuiz(quiz) {
  for (let i = 0; i < (quiz || []).length; i++) {
    const q = quiz[i];
    if (!q.text?.trim()) return { valid: false, error: `La domanda ${i + 1} non ha testo` };
    const filled = (q.options || []).filter((o) => o?.trim());
    if (filled.length < MIN_OPTIONS) {
      return { valid: false, error: `La domanda ${i + 1} deve avere almeno ${MIN_OPTIONS} risposte` };
    }
    if (filled.length !== q.options.length) {
      return { valid: false, error: `La domanda ${i + 1} ha una risposta vuota` };
    }
    if (q.correctIndex == null || !q.options[q.correctIndex]) {
      return { valid: false, error: `Segna la risposta corretta della domanda ${i + 1}` };
    }
  }
  return { valid: true };
}
