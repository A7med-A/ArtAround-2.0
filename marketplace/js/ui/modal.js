// ═══════════════════════════════════════════════════════════════
// MODAL — factory per dialoghi modali.
//
// Uso:
//   const m = openModal({
//     title: "Titolo",
//     width: 560,
//     bodyHTML: "<p>Contenuto...</p>",
//     onClose: () => { ... }
//   });
//   m.body  → l'elemento .aa-modal-body per inserire contenuti dinamici
//   m.close() → chiude la modale
// ═══════════════════════════════════════════════════════════════

import { iconHTML } from "./icon.js";

/**
 * @param {object} opts
 * @param {string} opts.title
 * @param {string|HTMLElement} [opts.bodyHTML]  HTML iniziale del body
 * @param {number} [opts.width=560]             Larghezza in px
 * @param {() => void} [opts.onClose]
 * @returns {{overlay: HTMLElement, dialog: HTMLElement, body: HTMLElement, close: () => void}}
 */
export function openModal({ title = "", bodyHTML = "", width = 560, onClose } = {}) {
  // Rimuovi eventuali modali con stessa classe (singleton soft)
  const overlay = document.createElement("div");
  overlay.className = "aa-modal-overlay";
  overlay.innerHTML = `
    <div class="aa-modal-dialog" style="--aa-modal-w:${width}px">
      <header class="aa-modal-header">
        <h3 class="aa-modal-title">${title}</h3>
        <button type="button" class="aa-modal-close" aria-label="Chiudi">
          ${iconHTML("close", { size: 18 })}
        </button>
      </header>
      <div class="aa-modal-body"></div>
    </div>
  `;

  const dialog = overlay.querySelector(".aa-modal-dialog");
  const body = overlay.querySelector(".aa-modal-body");
  if (typeof bodyHTML === "string") body.innerHTML = bodyHTML;
  else if (bodyHTML instanceof Node) body.appendChild(bodyHTML);

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    overlay.style.opacity = "0";
    setTimeout(() => overlay.remove(), 150);
    document.removeEventListener("keydown", escHandler);
    onClose?.();
  };

  // Click su overlay chiude (ma non click sul dialog interno)
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  // Click su X
  overlay.querySelector(".aa-modal-close").addEventListener("click", close);

  // ESC
  const escHandler = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", escHandler);

  document.body.appendChild(overlay);

  return { overlay, dialog, body, close };
}
