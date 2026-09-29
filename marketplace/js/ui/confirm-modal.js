// ═══════════════════════════════════════════════════════════════
// CONFIRM MODAL — modale di conferma per azioni distruttive.
// ═══════════════════════════════════════════════════════════════

import { openModal } from "./modal.js";
import { iconHTML } from "./icon.js";

/**
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.message    HTML supportato (è inserito grezzo)
 * @param {string} [opts.confirmLabel="Conferma"]
 * @param {string} [opts.cancelLabel="Annulla"]
 * @param {boolean} [opts.danger=false]
 * @param {() => void|Promise<void>} opts.onConfirm
 */
export function openConfirm({
  title,
  message,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  danger = false,
  onConfirm,
}) {
  const m = openModal({
    title,
    width: 460,
    bodyHTML: `
      <p style="font-size:13px;color:var(--t-textSec);line-height:1.5;margin:0 0 18px;">${message}</p>
      <div class="aa-modal-footer" style="margin-top:0;border-top:none;padding-top:0;">
        <button type="button" class="aa-btn" data-action="cancel">${cancelLabel}</button>
        <button type="button" class="aa-btn ${danger ? 'aa-btn--danger' : 'aa-btn--primary'}" data-action="confirm">
          ${iconHTML("trash", { size: 14 })}
          <span>${confirmLabel}</span>
        </button>
      </div>
    `,
  });

  m.body.querySelector("[data-action='cancel']").addEventListener("click", () => m.close());
  m.body.querySelector("[data-action='confirm']").addEventListener("click", async () => {
    try {
      await onConfirm?.();
    } finally {
      m.close();
    }
  });

  return m;
}
