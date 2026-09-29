// ═══════════════════════════════════════════════════════════════
// FLOOR / CELL UTILITIES
// Helpers per manipolare l'array Museum.floors lato client.
//
// Lo schema del backend usa cells SPARSE: solo le celle non vuote
// sono memorizzate, ognuna con { x, y, type, itemId? }.
// ═══════════════════════════════════════════════════════════════

import { CELL_TYPES, CELL_LABELS } from "./schema.js";

// ─── Tools / palette ──────────────────────────────────────────────

/**
 * Tools selezionabili nella toolbar.
 * 'select' / 'eraser' sono pseudo-tools.
 * Gli altri sono mappati 1:1 ai type del backend.
 */
export const TOOLS = [
  { id: "select",   label: "Seleziona", icon: "move",    isType: false },
  { id: "muro",     label: "Muro",      icon: "wall",    isType: true  },
  { id: "item",     label: "Opera",     icon: "artwork", isType: true  },
  { id: "ingresso", label: "Ingresso",  icon: "globe",   isType: true  },
  { id: "uscita",   label: "Uscita",    icon: "logout",  isType: true  },
  { id: "bagno",    label: "Bagno",     icon: "droplet", isType: true  },
  { id: "bar",      label: "Bar",       icon: "coffee",  isType: true  },
  { id: "eraser",   label: "Gomma",     icon: "eraser",  isType: false },
];

/**
 * Stile visivo di ogni type. Le var CSS sono definite in tokens.css.
 */
export const CELL_STYLES = {
  muro:     { bg: "var(--t-mapWall)",   border: "var(--t-mapWallBorder)",   icon: "wall",    iconColor: "var(--t-mapWallBorder)" },
  item:     { bg: "var(--t-mapArt)",    border: "var(--t-mapArtBorder)",    icon: "artwork", iconColor: "var(--t-mapArtBorder)" },
  ingresso: { bg: "var(--t-mapRoom)",   border: "var(--t-mapRoomBorder)",   icon: "globe",   iconColor: "var(--t-mapRoomBorder)" },
  uscita:   { bg: "var(--t-mapExit)",   border: "var(--t-mapExitBorder)",   icon: "logout",  iconColor: "var(--t-mapExitBorder)" },
  bagno:    { bg: "var(--t-mapBath)",   border: "var(--t-mapBathBorder)",   icon: "droplet", iconColor: "var(--t-mapBathBorder)" },
  bar:      { bg: "var(--t-mapBar)",    border: "var(--t-mapBarBorder)",    icon: "coffee",  iconColor: "var(--t-mapBarBorder)" },
};

// ─── Manipolazione cells ──────────────────────────────────────────

/**
 * Trova l'indice di una cella (x,y) nell'array sparse. -1 se assente.
 */
export function findCellIndex(cells, x, y) {
  if (!cells) return -1;
  for (let i = 0; i < cells.length; i++) {
    if (cells[i].x === x && cells[i].y === y) return i;
  }
  return -1;
}

/**
 * Recupera la cella alla posizione (x,y) o null.
 */
export function getCell(cells, x, y) {
  const i = findCellIndex(cells, x, y);
  return i >= 0 ? cells[i] : null;
}

/**
 * Imposta o aggiorna una cella (immutabile).
 * Se type è null/undefined, la rimuove (eraser).
 */
export function setCell(cells, x, y, patch) {
  const i = findCellIndex(cells || [], x, y);
  const current = i >= 0 ? cells[i] : null;

  if (patch === null || patch === undefined) {
    if (i < 0) return cells; // niente da fare
    return cells.filter((_, idx) => idx !== i);
  }

  const next = { x, y, ...current, ...patch };
  // Se per qualche motivo manca il type, non salviamo
  if (!CELL_TYPES.includes(next.type)) return cells;

  if (i < 0) return [...(cells || []), next];
  const copy = [...cells];
  copy[i] = next;
  return copy;
}

/**
 * Rimuove la cella (eraser).
 */
export function eraseCell(cells, x, y) {
  return setCell(cells, x, y, null);
}

/**
 * Conta celle per tipo all'interno di un floor.
 */
export function countByType(cells) {
  const counts = { muro: 0, item: 0, ingresso: 0, uscita: 0 };
  if (!cells) return counts;
  for (const c of cells) {
    if (counts[c.type] !== undefined) counts[c.type]++;
  }
  return counts;
}

// ─── Floor management ─────────────────────────────────────────────

/**
 * Crea un nuovo floor vuoto con dimensioni di default.
 */
export function emptyFloor(order, name = null) {
  return {
    order,
    name: name || `Piano ${order + 1}`,
    width: 30,
    height: 22,
    cells: [],
  };
}

/**
 * Re-numera gli order dei floors dopo un'aggiunta/rimozione.
 */
export function reorderFloors(floors) {
  return floors.map((f, i) => ({ ...f, order: i }));
}

/**
 * Verifica che (x,y) sia dentro i limiti di un floor.
 */
export function isInBounds(floor, x, y) {
  return x >= 0 && y >= 0 && x < floor.width && y < floor.height;
}

/**
 * Clamp dimensione di un piano nei limiti dello schema (1..100).
 */
export function clampDim(n) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return 1;
  return Math.max(1, Math.min(100, v));
}

/**
 * Ridimensiona un floor: aggiorna width/height e droppa le celle
 * che cadono fuori dai nuovi limiti.
 */
export function resizeFloor(floor, width, height) {
  const w = clampDim(width);
  const h = clampDim(height);
  return {
    ...floor,
    width: w,
    height: h,
    cells: (floor.cells || []).filter((c) => c.x < w && c.y < h),
  };
}

// ─── Stack undo/redo (semplice, basato su deep clone JSON) ────────

export function cloneFloors(floors) {
  return JSON.parse(JSON.stringify(floors));
}
