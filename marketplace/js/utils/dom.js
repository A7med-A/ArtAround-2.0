// ═══════════════════════════════════════════════════════════════
// DOM UTILITIES
// ═══════════════════════════════════════════════════════════════

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Escape HTML pericoloso */
export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Crea un elemento da una stringa HTML, ritorna il primo nodo. */
export function fromHtml(htmlString) {
  const tpl = document.createElement("template");
  tpl.innerHTML = htmlString.trim();
  return tpl.content.firstElementChild;
}

// Toast: re-export dal modulo dedicato
export { toast } from "../ui/toast.js";
