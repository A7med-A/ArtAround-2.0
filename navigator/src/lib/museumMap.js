// ═══════════════════════════════════════════════════════════════
// MUSEUM MAP — lettura di Museum.floors[] e calcolo dei percorsi
//
// Il server memorizza le celle in forma SPARSA: compaiono solo quelle
// non vuote, ciascuna { x, y, type, itemId? }. Tutto ciò che non è
// elencato è pavimento calpestabile.
// ═══════════════════════════════════════════════════════════════

import { BLOCKING_TYPES, CELL_METERS, SERVICE_TYPES } from "@/constants/schema";

export const cellKey = (x, y) => `${x},${y}`;

/** Piani del museo ordinati per `order` crescente. */
export function sortedFloors(museum) {
  return [...(museum?.floors || [])].sort((a, b) => a.order - b.order);
}

/** Piano con un dato `order`, oppure il primo disponibile. */
export function floorByOrder(museum, order) {
  const floors = sortedFloors(museum);
  return floors.find((f) => f.order === order) || floors[0] || null;
}

/** Indice "x,y" → cella, per lookup O(1) durante il rendering e la BFS. */
export function buildCellMap(floor) {
  const map = new Map();
  for (const cell of floor?.cells || []) map.set(cellKey(cell.x, cell.y), cell);
  return map;
}

/** Celle di un piano con un dato tipo. */
export function cellsOfType(floor, type) {
  return (floor?.cells || []).filter((c) => c.type === type);
}

/**
 * Individua su quale piano e in quale cella si trova un'opera.
 * L'associazione vive nella mappa (cell.type === "item" && cell.itemId).
 * @returns {{ floor, floorOrder, floorName, x, y } | null}
 */
export function findItemPlacement(museum, itemId) {
  if (!itemId) return null;
  const target = String(itemId);
  for (const floor of sortedFloors(museum)) {
    for (const cell of floor.cells || []) {
      if (cell.type === "item" && String(cell.itemId) === target) {
        return {
          floor,
          floorOrder: floor.order,
          floorName: floor.name,
          x: cell.x,
          y: cell.y,
        };
      }
    }
  }
  return null;
}

/** Mappa itemId → posizione, costruita in una sola passata sui piani. */
export function buildPlacementIndex(museum) {
  const index = new Map();
  for (const floor of sortedFloors(museum)) {
    for (const cell of floor.cells || []) {
      if (cell.type === "item" && cell.itemId) {
        index.set(String(cell.itemId), {
          floor,
          floorOrder: floor.order,
          floorName: floor.name,
          x: cell.x,
          y: cell.y,
        });
      }
    }
  }
  return index;
}

/** Punto di partenza del visitatore su un piano: l'ingresso, o il centro. */
export function entryPoint(floor) {
  if (!floor) return { x: 0, y: 0 };
  const ingressi = cellsOfType(floor, "ingresso");
  if (ingressi.length > 0) return { x: ingressi[0].x, y: ingressi[0].y };
  const uscite = cellsOfType(floor, "uscita");
  if (uscite.length > 0) return { x: uscite[0].x, y: uscite[0].y };
  return { x: Math.floor((floor.width - 1) / 2), y: Math.floor((floor.height - 1) / 2) };
}

const inBounds = (floor, x, y) => x >= 0 && y >= 0 && x < floor.width && y < floor.height;

/** Una cella blocca il passaggio solo se è un muro. */
function isBlocked(cellMap, x, y) {
  const cell = cellMap.get(cellKey(x, y));
  return !!cell && BLOCKING_TYPES.includes(cell.type);
}

const NEIGHBOURS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * Percorso più breve fra due celle con BFS, aggirando i muri.
 * Il traguardo può essere una cella occupata (opera, bagno, uscita…):
 * viene raggiunto ma non attraversato.
 *
 * @returns {Array<{x,y}>} percorso incluso di partenza e arrivo, [] se irraggiungibile.
 */
export function findPath(floor, from, to) {
  if (!floor || !from || !to) return [];
  if (!inBounds(floor, from.x, from.y) || !inBounds(floor, to.x, to.y)) return [];
  if (from.x === to.x && from.y === to.y) return [{ x: from.x, y: from.y }];

  const cellMap = buildCellMap(floor);
  const goal = cellKey(to.x, to.y);
  const prev = new Map();
  const visited = new Set([cellKey(from.x, from.y)]);
  const queue = [{ x: from.x, y: from.y }];

  while (queue.length > 0) {
    const current = queue.shift();
    for (const [dx, dy] of NEIGHBOURS) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const key = cellKey(nx, ny);
      if (!inBounds(floor, nx, ny) || visited.has(key)) continue;
      // Il traguardo è sempre accettato; le altre celle solo se non sono muri.
      if (key !== goal && isBlocked(cellMap, nx, ny)) continue;

      visited.add(key);
      prev.set(key, current);

      if (key === goal) {
        const path = [{ x: nx, y: ny }];
        let step = current;
        while (step) {
          path.push(step);
          step = prev.get(cellKey(step.x, step.y));
        }
        return path.reverse();
      }
      queue.push({ x: nx, y: ny });
    }
  }
  return [];
}

/** Lunghezza del percorso in metri (numero di passi × lato cella). */
export function pathMeters(path) {
  if (!path || path.length < 2) return 0;
  return Math.round((path.length - 1) * CELL_METERS);
}

/**
 * Servizio del tipo richiesto più vicino al visitatore, con il relativo percorso.
 * @returns {{ cell, path, meters } | null}
 */
export function nearestOfType(floor, from, type) {
  const candidates = cellsOfType(floor, type);
  if (candidates.length === 0) return null;

  let best = null;
  for (const cell of candidates) {
    const path = findPath(floor, from, cell);
    if (path.length === 0) continue;
    if (!best || path.length < best.path.length) {
      best = { cell, path, meters: pathMeters(path) };
    }
  }
  // Nessun percorso praticabile: ripiega sulla distanza in linea d'aria.
  if (!best) {
    const cell = candidates.reduce((a, b) =>
      Math.abs(a.x - from.x) + Math.abs(a.y - from.y) <=
      Math.abs(b.x - from.x) + Math.abs(b.y - from.y)
        ? a
        : b,
    );
    const steps = Math.abs(cell.x - from.x) + Math.abs(cell.y - from.y);
    return { cell, path: [], meters: Math.round(steps * CELL_METERS) };
  }
  return best;
}

/**
 * Servizio di un dato tipo, cercato prima sul piano corrente e poi sugli altri.
 *
 * Nei musei reali i servizi stanno spesso su un piano solo — tipicamente
 * quello d'ingresso — mentre il visitatore è altrove: limitarsi al piano
 * corrente vorrebbe dire rispondere "non disponibile" a chi cerca la toilette.
 * Sugli altri piani il percorso parte dal loro ingresso, perché la mappa non
 * modella i collegamenti verticali.
 *
 * @returns {{ type, floor, cell, path, meters, sameFloor, count } | null}
 */
export function findService(museum, currentFloor, from, type) {
  const onCurrent = currentFloor ? nearestOfType(currentFloor, from, type) : null;
  if (onCurrent) {
    return {
      type,
      floor: currentFloor,
      ...onCurrent,
      sameFloor: true,
      count: cellsOfType(currentFloor, type).length,
    };
  }

  // Piano più vicino, in numero di piani da salire o scendere.
  const candidates = sortedFloors(museum)
    .filter((f) => f.order !== currentFloor?.order && cellsOfType(f, type).length > 0)
    .sort(
      (a, b) =>
        Math.abs(a.order - (currentFloor?.order ?? 0)) -
        Math.abs(b.order - (currentFloor?.order ?? 0)),
    );

  for (const floor of candidates) {
    const found = nearestOfType(floor, entryPoint(floor), type);
    if (!found) continue;
    return {
      type,
      floor,
      ...found,
      sameFloor: false,
      count: cellsOfType(floor, type).length,
    };
  }
  return null;
}

/**
 * Servizi raggiungibili dal visitatore, ordinati per vicinanza.
 * Quelli sul piano corrente vengono prima, poi gli altri piani.
 */
export function listServices(museum, currentFloor, from) {
  const out = [];
  for (const type of SERVICE_TYPES) {
    const found = findService(museum, currentFloor, from, type);
    if (found) out.push(found);
  }
  return out.sort(
    (a, b) => Number(b.sameFloor) - Number(a.sameFloor) || a.meters - b.meters,
  );
}

/**
 * Raggruppa celle contigue dello stesso tipo in un unico "pin", così che
 * un bagno disegnato su 4 celle non produca 4 icone sovrapposte.
 * @returns {Array<{ x, y, type, cells }>} coordinate = baricentro del gruppo.
 */
export function clusterCells(floor, types) {
  const cellMap = buildCellMap(floor);
  const wanted = new Set(types);
  const seen = new Set();
  const clusters = [];

  for (const cell of floor?.cells || []) {
    const key = cellKey(cell.x, cell.y);
    if (!wanted.has(cell.type) || seen.has(key)) continue;

    const group = [];
    const stack = [cell];
    seen.add(key);

    while (stack.length > 0) {
      const current = stack.pop();
      group.push(current);
      for (const [dx, dy] of NEIGHBOURS) {
        const nKey = cellKey(current.x + dx, current.y + dy);
        const neighbour = cellMap.get(nKey);
        if (neighbour && neighbour.type === cell.type && !seen.has(nKey)) {
          seen.add(nKey);
          stack.push(neighbour);
        }
      }
    }

    clusters.push({
      type: cell.type,
      x: group.reduce((s, c) => s + c.x, 0) / group.length,
      y: group.reduce((s, c) => s + c.y, 0) / group.length,
      cells: group,
    });
  }
  return clusters;
}

/** Numero totale di opere collocate sulla mappa del museo. */
export function countPlacedItems(museum) {
  return sortedFloors(museum).reduce(
    (sum, floor) => sum + cellsOfType(floor, "item").length,
    0,
  );
}
