// ═══════════════════════════════════════════════════════════════
// MUSEUM SELECTOR — dropdown per scegliere/creare/modificare il museo.
// ═══════════════════════════════════════════════════════════════

import { store } from "../core/store.js";
import { auth } from "../core/auth.js";
import { museumsService } from "../services/museums.service.js";
import { iconHTML } from "./icon.js";
import { toast } from "./toast.js";
import { openMuseumCreateModal, openMuseumEditModal } from "./museum-modals.js";
import { escapeHtml } from "../utils/dom.js";

export function mountMuseumSelector(target) {
  target.classList.add("aa-museum-selector");
  let isOpen = false;

  /** Permessi UI in base al ruolo dell'utente. */
  const canEditMuseum = (slug) => {
    if (auth.isAdmin()) return true;
    if (auth.isAuthor()) return (auth.myMuseumSlugs() || []).includes(slug);
    return false;
  };
  // Solo gli admin possono creare musei. L'accesso degli autori viene
  // concesso dall'admin nella sezione "Gestione utenti".
  const canCreateMuseum = () => auth.isAdmin();

  const render = () => {
    const museums = store.museums.get();
    const activeSlug = store.activeMuseum.get();
    const active = museums.find((m) => m.slug === activeSlug);
    const label = active ? active.name : (museums.length === 0 ? "Nessun museo" : "Seleziona...");

    target.innerHTML = `
      <div class="aa-sidebar__section-label">Museo attivo</div>
      <button class="aa-museum-selector__trigger" type="button" data-action="toggle">
        <span class="aa-museum-selector__dot"></span>
        <span class="aa-museum-selector__name">${escapeHtml(label)}</span>
        ${iconHTML("chevronDown", { size: 12, color: "var(--t-textMuted)" })}
      </button>
      ${isOpen ? `
        <div class="aa-museum-selector__menu">
          ${museums.length === 0 ? `
            <div class="aa-museum-selector__empty">Nessun museo disponibile</div>
          ` : museums.map((m) => `
            <div class="aa-museum-row ${m.slug === activeSlug ? 'is-active' : ''}">
              <button class="aa-museum-row__btn" data-slug="${escapeHtml(m.slug)}" title="Seleziona museo">
                ${escapeHtml(m.name)}
              </button>
              ${canEditMuseum(m.slug) ? `
                <button class="aa-museum-row__edit" data-edit-slug="${escapeHtml(m.slug)}" title="Modifica museo">
                  ${iconHTML("edit", { size: 12 })}
                </button>
              ` : ""}
            </div>
          `).join("")}
          ${canCreateMuseum() ? `
            ${museums.length > 0 ? `<div class="aa-museum-selector__sep"></div>` : ""}
            <button class="aa-museum-selector__create" type="button" data-action="create">
              ${iconHTML("plus", { size: 13 })}
              <span>Nuovo museo</span>
            </button>
          ` : ""}
        </div>
      ` : ""}
    `;
  };

  // Listeners
  target.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".aa-museum-row__edit");
    if (editBtn) {
      e.stopPropagation();
      const slug = editBtn.dataset.editSlug;
      const m = store.museums.get().find((x) => x.slug === slug);
      if (m) {
        isOpen = false;
        render();
        handleEdit(m);
      }
      return;
    }
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "toggle") {
      isOpen = !isOpen;
      render();
      return;
    }
    if (action === "create") {
      isOpen = false;
      render();
      handleCreate();
      return;
    }
    const itemBtn = e.target.closest(".aa-museum-row__btn");
    if (itemBtn) {
      const slug = itemBtn.dataset.slug;
      store.activeMuseum.set(slug);
      isOpen = false;
      render();
    }
  });

  // Click esterno chiude il menu.
  // Usa composedPath() invece di contains(): quando render() sostituisce
  // target.innerHTML, e.target non è più nel DOM e contains() ritornerebbe
  // false anche per click avvenuti dentro al selector. composedPath() fissa
  // il path al momento del dispatch e non risente delle mutazioni DOM.
  document.addEventListener("click", (e) => {
    if (isOpen && !e.composedPath().includes(target)) {
      isOpen = false;
      render();
    }
  });

  // Subscribe per aggiornare quando cambiano store
  store.activeMuseum.subscribe(() => render());
  store.museums.subscribe(() => render());

  function handleCreate() {
    openMuseumCreateModal({
      onCreate: async (payload) => {
        try {
          const created = await museumsService.create(payload);
          store.museums.set([...store.museums.get(), created]);
          store.activeMuseum.set(created.slug);
          // Aggiorna lo user locale: l'autore ha ora un museumSlug
          await auth.refreshMe();
          toast(`Museo "${created.name}" creato`, "success");
          return true;
        } catch (err) {
          console.error(err);
          const msg = err?.message || "";
          if (/duplicate key|E11000|unique/i.test(msg)) {
            toast("Esiste già un museo con questo slug", "danger");
          } else {
            toast(msg || "Errore nella creazione del museo", "danger");
          }
          return false;
        }
      },
    });
  }

  function handleEdit(museum) {
    openMuseumEditModal({
      data: museum,
      onSave: async (payload) => {
        const slug = payload.slug;
        const { _id, slug: _s, createdAt, updatedAt, __v, floors, ...patch } = payload;
        try {
          const result = await museumsService.update(slug, patch);
          store.museums.set(store.museums.get().map((m) =>
            m.slug === slug ? { ...m, ...result } : m
          ));
          toast(`Museo "${result.name}" aggiornato`, "success");
          return true;
        } catch (err) {
          console.error(err);
          toast(err?.message || "Errore nell'aggiornamento", "danger");
          return false;
        }
      },
    });
  }

  render();
}
