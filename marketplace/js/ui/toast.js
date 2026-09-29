// ═══════════════════════════════════════════════════════════════
// TOAST — notifiche transienti.
// Uso: toast("Operazione completata", "success")
// ═══════════════════════════════════════════════════════════════

let _container = null;

function getContainer() {
  if (_container && document.body.contains(_container)) return _container;
  _container = document.createElement("div");
  _container.className = "aa-toasts";
  document.body.appendChild(_container);
  return _container;
}

/**
 * Mostra un toast.
 * @param {string} message
 * @param {"info"|"success"|"danger"} [variant]
 * @param {number} [duration] millisecondi
 */
export function toast(message, variant = "info", duration = 3500) {
  const c = getContainer();
  const el = document.createElement("div");
  el.className = `aa-toast aa-toast--${variant}`;
  el.textContent = message;
  c.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(-4px)";
    el.style.transition = "opacity 0.2s, transform 0.2s";
    setTimeout(() => el.remove(), 200);
  }, duration);
}
