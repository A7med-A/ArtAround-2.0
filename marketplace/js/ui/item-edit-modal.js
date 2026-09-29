// ═══════════════════════════════════════════════════════════════
// ITEM EDIT MODAL — crea/modifica un Item.
// ═══════════════════════════════════════════════════════════════

import { LICENSES, LICENSE_LABELS, VISIBILITIES, VISIBILITY_LABELS } from "../utils/schema.js";
import { auth } from "../core/auth.js";
import { validateItem } from "../utils/validators.js";
import { escapeHtml } from "../utils/dom.js";
import { iconHTML } from "./icon.js";
import { openModal } from "./modal.js";
import { toast } from "./toast.js";
import { mountTagInput } from "./tag-input.js";
import { mountTextVariantEditor } from "./text-variant-editor.js";

/**
 * @param {{ data: object, onSave: (item) => Promise<boolean> }} opts
 */
export function openItemEditModal({ data: original, onSave }) {
  const data = JSON.parse(JSON.stringify(original));
  const isNew = !data._id;
  const m = openModal({ title: isNew ? "Nuova opera" : "Modifica opera", width: 640 });

  const licenseOptions = LICENSES.map((v) => ({ value: v, label: LICENSE_LABELS[v] }));

  // Il docente produce solo materiale proprio e privato: il campo non è una
  // scelta per lui, quindi lo mostriamo bloccato invece di lasciargli credere
  // di poter pubblicare qualcosa che il server rifiuterebbe.
  const forcedPrivate = auth.isTeacher();
  const visibility = forcedPrivate ? "privata" : data.visibility || "pubblica";
  if (forcedPrivate) data.visibility = "privata";

  const visibilityOptions = (forcedPrivate ? ["privata"] : VISIBILITIES).map((v) => ({
    value: v,
    label: VISIBILITY_LABELS[v],
  }));

  m.body.innerHTML = `
    <div class="aa-form-grid">
      <div class="aa-field">
        <label class="aa-field__label">Titolo</label>
        <input class="aa-input" type="text" data-field="title" value="${escapeHtml(data.title || "")}" placeholder="Es. Estasi di Santa Cecilia" required />
      </div>

      <div class="aa-form-row-2">
        <div class="aa-field">
          <label class="aa-field__label">Artista</label>
          <input class="aa-input" type="text" data-field="artist" value="${escapeHtml(data.artist || "")}" placeholder="Es. Raffaello Sanzio" />
        </div>
        <div class="aa-field">
          <label class="aa-field__label">Periodo</label>
          <input class="aa-input" type="text" data-field="period" value="${escapeHtml(data.period || "")}" placeholder="Es. 1515-1517" />
        </div>
      </div>

      <div class="aa-field">
        <label class="aa-field__label">Descrizione</label>
        <textarea class="aa-textarea" rows="3" data-field="description" placeholder="Breve descrizione oggettiva dell'opera…">${escapeHtml(data.description || "")}</textarea>
      </div>

      <div class="aa-field">
        <label class="aa-field__label">URL immagine</label>
        <input class="aa-input" type="url" data-field="imageUrl" value="${escapeHtml(data.imageUrl || "")}" placeholder="https://..." />
      </div>

      <hr class="aa-divider" />

      <div data-slot="tags"></div>

      <hr class="aa-divider" />

      <div data-slot="texts"></div>

      <hr class="aa-divider" />

      <div class="aa-form-row-2">
        <div class="aa-field">
          <label class="aa-field__label">Licenza</label>
          <select class="aa-select" data-field="license">
            ${licenseOptions.map((o) => `<option value="${o.value}" ${o.value === data.license ? 'selected' : ''}>${o.label}</option>`).join("")}
          </select>
        </div>
        <div class="aa-field">
          <label class="aa-field__label">Visibilità</label>
          <select class="aa-select" data-field="visibility" ${forcedPrivate ? "disabled" : ""}>
            ${visibilityOptions.map((o) => `<option value="${o.value}" ${o.value === visibility ? 'selected' : ''}>${o.label}</option>`).join("")}
          </select>
          <p class="aa-field__hint">
            ${forcedPrivate
              ? "Il tuo materiale didattico resta sempre privato: lo vedi solo tu e i tuoi studenti, attraverso le visite che lo includono."
              : "Un'opera privata non compare nel catalogo del Navigator: la vedono solo i visitatori di una visita che la include."}
          </p>
        </div>
      </div>

    </div>

    <div class="aa-modal-footer">
      <button type="button" class="aa-btn" data-action="cancel">Annulla</button>
      <button type="button" class="aa-btn aa-btn--primary" data-action="save">
        ${iconHTML("save", { size: 14 })}
        <span>${isNew ? "Crea opera" : "Salva modifiche"}</span>
      </button>
    </div>
  `;

  // Mount sub-controls
  mountTagInput(m.body.querySelector('[data-slot="tags"]'), {
    label: "Tag",
    value: data.tags || [],
    onChange: (arr) => { data.tags = arr; },
  });
  mountTextVariantEditor(m.body.querySelector('[data-slot="texts"]'), {
    value: data.texts || [],
    onChange: (arr) => { data.texts = arr; },
  });

  // Generic field bindings
  m.body.addEventListener("input", (e) => {
    const field = e.target.dataset.field;
    if (!field) return;
    data[field] = e.target.value;
  });
  m.body.addEventListener("change", (e) => {
    const field = e.target.dataset.field;
    if (!field) return;
    data[field] = e.target.value;
  });

  m.body.querySelector("[data-action='cancel']").addEventListener("click", () => m.close());
  m.body.querySelector("[data-action='save']").addEventListener("click", async () => {
    const { valid, errors } = validateItem(data);
    if (!valid) {
      const firstError = Object.values(errors)[0];
      return toast(`Errore: ${firstError}`, "danger");
    }
    const ok = await onSave?.(data);
    if (ok) m.close();
  });
}
