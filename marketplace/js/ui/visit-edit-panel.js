// ═══════════════════════════════════════════════════════════════
// VISIT EDIT PANEL — pannello full-screen per creare/modificare
// una visita con metadati + lista tappe.
// ═══════════════════════════════════════════════════════════════

import { escapeHtml } from "../utils/dom.js";
import { auth } from "../core/auth.js";
import { VISIT_MODE_LABELS, VISIT_MODE_HINTS } from "../utils/schema.js";
import { iconHTML } from "./icon.js";
import { stopRowHTML } from "./stop-row.js";
import { toast } from "./toast.js";
import { openItemPickerModal } from "./item-picker-modal.js";
import { mountQuizEditor, validateQuiz } from "./quiz-editor.js";

/**
 * Monta il pannello di edit nel target.
 * @param {HTMLElement} target
 * @param {object} opts
 * @param {object} opts.data - visita
 * @param {object[]} opts.allItems - tutti gli item del museo
 * @param {() => void} opts.onClose
 * @param {(visit: object) => Promise<boolean>} opts.onSave
 */
export function mountVisitEditPanel(target, { data: original, allItems, onClose, onSave }) {
  const data = JSON.parse(JSON.stringify(original));
  data.items = (data.items || []).map((it) => typeof it === "object" && it !== null ? it._id : it);

  // La modalità non si sceglie: discende dal ruolo. Un docente prepara
  // percorsi da condurre in classe, chi cura il museo percorsi che il
  // visitatore segue da solo. Qui la mostriamo, non la chiediamo.
  const isGuided = auth.isTeacher();
  data.mode = isGuided ? "guidata" : "libera";
  data.quiz = isGuided ? data.quiz || [] : [];

  const itemMap = new Map(allItems.map((it) => [it._id, it]));
  target.classList.add("aa-visit-edit");

  target.innerHTML = `
    <header class="aa-visit-edit__header">
      <button type="button" class="aa-visit-edit__crumb" data-action="close">
        ${iconHTML("chevronLeft", { size: 14 })}
        <span>Visite</span>
      </button>
      <span class="aa-visit-edit__crumb-sep">·</span>
      <span class="aa-visit-edit__panel-title">${escapeHtml(data.title || "Nuova visita")}</span>
      <div class="aa-visit-edit__actions">
        <button type="button" class="aa-btn aa-btn--ghost" data-action="close">Annulla</button>
        <button type="button" class="aa-btn aa-btn--primary" data-action="save">
          ${iconHTML("save", { size: 14 })}
          <span>Salva visita</span>
        </button>
      </div>
    </header>

    <div class="aa-visit-edit__body">
      <aside class="aa-visit-edit__sidebar">
        <div class="aa-panel">
          <h3 class="aa-panel__title">Dettagli visita</h3>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div class="aa-field">
              <label class="aa-field__label">Titolo</label>
              <input class="aa-input" type="text" data-field="title" value="${escapeHtml(data.title || "")}" placeholder="Nome della visita" required />
            </div>
            <div class="aa-field">
              <label class="aa-field__label">Descrizione</label>
              <textarea class="aa-textarea" rows="3" data-field="description" placeholder="Breve descrizione del percorso…">${escapeHtml(data.description || "")}</textarea>
            </div>
            <div class="aa-field">
              <label class="aa-field__label">Modalità</label>
              <div class="aa-mode-tag">
                ${iconHTML(isGuided ? "users" : "user", { size: 13 })}
                <span>${VISIT_MODE_LABELS[data.mode]}</span>
              </div>
              <p class="aa-field__hint">${VISIT_MODE_HINTS[data.mode]}</p>
            </div>
          </div>
        </div>

        <div class="aa-panel">
          <h3 class="aa-panel__title">Statistiche</h3>
          <div class="aa-stats" data-slot="stats"></div>
        </div>
      </aside>

      <div class="aa-visit-edit__right">
        <div class="aa-visit-edit__right-head">
          <h2 class="aa-visit-edit__right-title">Tappe del percorso</h2>
          <button type="button" class="aa-btn aa-btn--small" data-action="add-stop">
            ${iconHTML("plus", { size: 13 })}
            <span>Aggiungi tappa</span>
          </button>
        </div>
        <div class="aa-stops-list" data-slot="stops"></div>

        ${isGuided ? `
          <div class="aa-panel" style="margin-top:18px;">
            <div data-slot="quiz"></div>
          </div>
        ` : ""}
      </div>
    </div>
  `;

  // Il quiz esiste solo nelle visite guidate, cioè solo per i docenti.
  if (isGuided) {
    mountQuizEditor(target.querySelector('[data-slot="quiz"]'), {
      value: data.quiz,
      onChange: (quiz) => { data.quiz = quiz; },
    });
  }

  const renderStats = () => {
    const wrap = target.querySelector('[data-slot="stats"]');
    if (!wrap) return;
    const stops = data.items || [];
    const totalVariants = stops.reduce((acc, id) => {
      const it = itemMap.get(id);
      return acc + (it?.texts?.length || 0);
    }, 0);
    wrap.innerHTML = `
      <div class="aa-stat-row"><span>Tappe totali</span><strong>${stops.length}</strong></div>
      <div class="aa-stat-row"><span>Item disponibili</span><strong>${allItems.length}</strong></div>
      <div class="aa-stat-row"><span>Varianti totali</span><strong>${totalVariants}</strong></div>
    `;
  };

  const renderStops = () => {
    const list = target.querySelector('[data-slot="stops"]');
    const stops = data.items || [];
    if (stops.length === 0) {
      list.innerHTML = `
        <div class="aa-empty-stops">
          ${iconHTML("visits", { size: 32, color: "var(--t-textMuted)" })}
          <p style="font-size:14px;margin:0;">Nessuna tappa. Aggiungi opere al percorso.</p>
          <button type="button" class="aa-btn" data-action="add-stop">
            ${iconHTML("plus", { size: 14 })}
            <span>Aggiungi tappa</span>
          </button>
        </div>
      `;
      return;
    }
    list.innerHTML = stops.map((id, i) => {
      const item = itemMap.get(id) || {
        _id: id, title: "Item rimosso", artist: "—", period: "—", texts: [],
      };
      return stopRowHTML({ item, index: i, total: stops.length });
    }).join("");
  };

  // Field bindings
  target.addEventListener("input", (e) => {
    const field = e.target.dataset.field;
    // Gli input dell'editor del quiz si gestiscono da soli.
    if (!field || field === "text" || field === "option") return;
    data[field] = e.target.value;
    if (field === "title") {
      const t = target.querySelector(".aa-visit-edit__panel-title");
      if (t) t.textContent = data.title || "Nuova visita";
    }
  });

  // Click handlers
  target.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "close") return onClose?.();
    if (action === "save") return handleSave();
    if (action === "add-stop") return openPicker();

    // Stop row actions
    const stopRow = e.target.closest(".aa-stop-row");
    if (stopRow) {
      const idx = parseInt(stopRow.dataset.index, 10);
      const inner = e.target.closest("[data-action]")?.dataset.action;
      if (inner === "up") moveStop(idx, -1);
      else if (inner === "down") moveStop(idx, 1);
      else if (inner === "remove") removeStop(idx);
    }
  });

  function moveStop(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= data.items.length) return;
    const items = [...data.items];
    [items[index], items[target]] = [items[target], items[index]];
    data.items = items;
    renderStops();
    renderStats();
  }
  function removeStop(index) {
    data.items = data.items.filter((_, i) => i !== index);
    renderStops();
    renderStats();
  }
  function openPicker() {
    openItemPickerModal({
      items: allItems,
      excludeIds: data.items,
      onPicked: (newIds) => {
        data.items = [...data.items, ...newIds];
        renderStops();
        renderStats();
      },
    });
  }

  async function handleSave() {
    if (!data.title?.trim()) return toast("Il titolo è obbligatorio", "danger");
    if (!data.description?.trim()) return toast("La descrizione è obbligatoria", "danger");

    if (isGuided) {
      const { valid, error } = validateQuiz(data.quiz);
      if (!valid) return toast(error, "danger");
    }

    await onSave?.(data);
  }

  renderStats();
  renderStops();
}
