// ═══════════════════════════════════════════════════════════════
// useKeyboardShortcuts — scorciatoie da tastiera.
//
// Su smartphone i comandi grandi si premono camminando; su desktop
// l'equivalente naturale è la tastiera, e senza di essa la visita si
// percorrerebbe solo a colpi di mouse.
//
// Le scorciatoie restano inattive mentre si scrive in un campo o quando
// è aperto un overlay modale, per non rubare tasti a chi sta digitando.
// ═══════════════════════════════════════════════════════════════

import { useEffect } from "react";

const TYPING_TAGS = ["INPUT", "TEXTAREA", "SELECT"];

function isTyping(target) {
  if (!target) return false;
  return TYPING_TAGS.includes(target.tagName) || target.isContentEditable;
}

/**
 * @param {Object<string, Function>} bindings  mappa `event.key` → azione
 * @param {boolean} enabled                    false sospende le scorciatoie
 */
export default function useKeyboardShortcuts(bindings, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;

    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTyping(event.target)) return;

      const handler = bindings[event.key];
      if (!handler) return;

      event.preventDefault();
      handler();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [bindings, enabled]);
}
