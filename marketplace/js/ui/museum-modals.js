// ═══════════════════════════════════════════════════════════════
// MUSEUM CREATE / EDIT MODAL
// ═══════════════════════════════════════════════════════════════

import { auth } from "../core/auth.js";
import { iconHTML } from "./icon.js";
import { openModal } from "./modal.js";
import { toast } from "./toast.js";
import { escapeHtml } from "../utils/dom.js";

function slugify(name) {
  return (name || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Modale per creare un nuovo museo.
 * @param {{ onCreate: (payload) => Promise<boolean> }} opts
 */
export function openMuseumCreateModal({ onCreate }) {
  const data = { name: "", slug: "", description: "", address: "" };
  let slugTouched = false;

  const m = openModal({ title: "Nuovo museo", width: 560 });

  m.body.innerHTML = `
    <div class="aa-form-grid">
      <div class="aa-field">
        <label class="aa-field__label">Nome museo</label>
        <input class="aa-input" type="text" data-field="name" placeholder="Es. Pinacoteca Nazionale di Bologna" required />
      </div>

      <div class="aa-field">
        <label class="aa-field__label">Slug (URL)</label>
        <input class="aa-input" type="text" data-field="slug" placeholder="pinacoteca-bologna" required />
      </div>
      <p class="aa-form-hint">Identificativo univoco usato nelle URL. Solo lettere minuscole, numeri e trattini. Si genera automaticamente dal nome.</p>

      <div class="aa-field">
        <label class="aa-field__label">Descrizione</label>
        <textarea class="aa-textarea" rows="3" data-field="description" placeholder="Breve descrizione del museo…"></textarea>
      </div>

      <div class="aa-field">
        <label class="aa-field__label">Indirizzo</label>
        <input class="aa-input" type="text" data-field="address" placeholder="Via Esempio 1, Città" />
      </div>

    </div>

    <div class="aa-modal-footer">
      <button type="button" class="aa-btn" data-action="cancel">Annulla</button>
      <button type="button" class="aa-btn aa-btn--primary" data-action="create">
        ${iconHTML("plus", { size: 14 })}
        <span>Crea museo</span>
      </button>
    </div>
  `;

  // Field handlers
  m.body.addEventListener("input", (e) => {
    const field = e.target.dataset.field;
    if (!field) return;
    if (field === "name") {
      data.name = e.target.value;
      if (!slugTouched) {
        data.slug = slugify(data.name);
        const slugInput = m.body.querySelector('[data-field="slug"]');
        if (slugInput) slugInput.value = data.slug;
      }
    } else if (field === "slug") {
      slugTouched = true;
      const cleaned = slugify(e.target.value);
      data.slug = cleaned;
      if (e.target.value !== cleaned) e.target.value = cleaned;
    } else {
      data[field] = e.target.value;
    }
  });

  m.body.querySelector("[data-action='cancel']").addEventListener("click", () => m.close());
  m.body.querySelector("[data-action='create']").addEventListener("click", async () => {
    const name = data.name.trim();
    const slug = data.slug.trim();
    if (!name) return toast("Il nome del museo è obbligatorio", "danger");
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return toast("Lo slug deve contenere solo lettere minuscole, numeri e trattini", "danger");
    }
    const user = auth.currentUser();
    const payload = {
      name,
      slug,
      description: (data.description || "").trim(),
      address: (data.address || "").trim(),
      createdBy: user?.username || "demo",
      floors: [],
    };
    const ok = await onCreate?.(payload);
    if (ok) m.close();
  });

  // focus iniziale
  setTimeout(() => m.body.querySelector('[data-field="name"]')?.focus(), 50);
}

/**
 * Modale per modificare un museo esistente.
 * @param {{ data: object, onSave: (payload) => Promise<boolean> }} opts
 */
export function openMuseumEditModal({ data: original, onSave }) {
  const data = JSON.parse(JSON.stringify(original));
  const m = openModal({ title: "Modifica museo", width: 560 });
  const counts = { floors: (data.floors || []).length };

  m.body.innerHTML = `
    <div class="aa-form-grid">
      <div style="display:flex;flex-wrap:wrap;gap:10px;padding:12px 14px;background:var(--t-bg);border:1px solid var(--t-border);border-radius:8px;font-size:12px;color:var(--t-textSec);">
        <span><strong class="aa-summary-name" style="color:var(--t-gold);font-weight:600;">${escapeHtml(data.name || "Museo senza nome")}</strong></span>
        <span>·</span>
        <span><strong style="color:var(--t-text);">${counts.floors}</strong> piano/i</span>
      </div>

      <div class="aa-field">
        <label class="aa-field__label">Nome museo</label>
        <input class="aa-input" type="text" data-field="name" value="${escapeHtml(data.name || "")}" required />
      </div>

      <div class="aa-field">
        <label class="aa-field__label">Slug (URL)</label>
        <div class="aa-slug-readonly" title="Lo slug non è modificabile dopo la creazione">${escapeHtml(data.slug || "")}</div>
      </div>
      <p class="aa-form-hint">Lo slug identifica il museo in URL e nei riferimenti di item/visit. Per cambiarlo serve creare un nuovo museo.</p>

      <div class="aa-field">
        <label class="aa-field__label">Descrizione</label>
        <textarea class="aa-textarea" rows="3" data-field="description">${escapeHtml(data.description || "")}</textarea>
      </div>

      <div class="aa-field">
        <label class="aa-field__label">Indirizzo</label>
        <input class="aa-input" type="text" data-field="address" value="${escapeHtml(data.address || "")}" />
      </div>

      <div class="aa-field">
        <label class="aa-field__label">URL logo</label>
        <input class="aa-input" type="url" data-field="logoUrl" value="${escapeHtml(data.logoUrl || "")}" placeholder="https://..." />
      </div>

      <div class="aa-field">
        <label class="aa-field__label">URL immagine di copertina</label>
        <input class="aa-input" type="url" data-field="coverImageUrl" value="${escapeHtml(data.coverImageUrl || "")}" placeholder="https://..." />
      </div>

    </div>

    <div class="aa-modal-footer">
      <button type="button" class="aa-btn" data-action="cancel">Annulla</button>
      <button type="button" class="aa-btn aa-btn--primary" data-action="save">
        ${iconHTML("save", { size: 14 })}
        <span>Salva modifiche</span>
      </button>
    </div>
  `;

  m.body.addEventListener("input", (e) => {
    const field = e.target.dataset.field;
    if (!field) return;
    data[field] = e.target.value;
    if (field === "name") {
      const summary = m.body.querySelector(".aa-summary-name");
      if (summary) summary.textContent = data.name || "Museo senza nome";
    }
  });

  m.body.querySelector("[data-action='cancel']").addEventListener("click", () => m.close());
  m.body.querySelector("[data-action='save']").addEventListener("click", async () => {
    if (!(data.name || "").trim()) return toast("Il nome del museo è obbligatorio", "danger");
    const payload = {
      ...data,
      name: data.name.trim(),
      description: (data.description || "").trim(),
      address: (data.address || "").trim(),
    };
    const ok = await onSave?.(payload);
    if (ok) m.close();
  });
}
