// ═══════════════════════════════════════════════════════════════
// STORE — stato globale dell'app loggata
// Reattivo via pub/sub. I componenti si sottoscrivono solo a ciò
// che gli interessa.
// ═══════════════════════════════════════════════════════════════

import { CONFIG } from "./config.js";

function createObservable(initial) {
  let value = initial;
  const listeners = new Set();
  return {
    get: () => value,
    set(v) {
      if (v === value) return;
      value = v;
      listeners.forEach((fn) => {
        try { fn(value); } catch (e) { console.error(e); }
      });
    },
    subscribe(fn) {
      listeners.add(fn);
      fn(value);
      return () => listeners.delete(fn);
    },
  };
}

// Slug del museo correntemente selezionato (persistito)
const _activeMuseum = createObservable(
  localStorage.getItem(CONFIG.STORAGE.ACTIVE_MUSEUM) || null
);

// Sezione corrente: 'items' | 'visits' | 'map'
const _section = createObservable(
  localStorage.getItem(CONFIG.STORAGE.SECTION) || CONFIG.SECTIONS.ITEMS
);

// Lista musei caricati dall'API (cached)
const _museums = createObservable([]);

export const store = {
  // ─── activeMuseum ───
  activeMuseum: {
    get: () => _activeMuseum.get(),
    set: (slug) => {
      _activeMuseum.set(slug);
      if (slug) localStorage.setItem(CONFIG.STORAGE.ACTIVE_MUSEUM, slug);
      else localStorage.removeItem(CONFIG.STORAGE.ACTIVE_MUSEUM);
    },
    subscribe: (fn) => _activeMuseum.subscribe(fn),
  },

  // ─── section ───
  section: {
    get: () => _section.get(),
    set: (s) => {
      _section.set(s);
      localStorage.setItem(CONFIG.STORAGE.SECTION, s);
    },
    subscribe: (fn) => _section.subscribe(fn),
  },

  // ─── museums (lista caricata) ───
  museums: {
    get: () => _museums.get(),
    set: (list) => _museums.set(list),
    subscribe: (fn) => _museums.subscribe(fn),
    /** Trova museo dal suo slug */
    find: (slug) => _museums.get().find((m) => m.slug === slug) || null,
  },
};
