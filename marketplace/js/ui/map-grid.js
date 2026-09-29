// ═══════════════════════════════════════════════════════════════
// MAP GRID — griglia interattiva di celle del piano attivo.
// Supporta paint-and-drag, eraser, select.
// ═══════════════════════════════════════════════════════════════

import { CELL_STYLES, getCell } from "../utils/map.js";
import { iconHTML } from "./icon.js";

export function mountMapGrid(target, { floor = null, tool = "select", selectedCell = null, zoom = 1 } = {}, handlers = {}) {
  let state = { floor, tool, selectedCell, zoom };
  let isDragging = false;

  const render = () => {
    if (!state.floor) {
      target.innerHTML = "";
      return;
    }
    const { width, height, cells = [] } = state.floor;
    const cellByXY = new Map();
    cells.forEach((c) => cellByXY.set(`${c.x},${c.y}`, c));
    const cellSize = 28 * state.zoom;

    let html = `<div class="aa-map-grid" style="grid-template-columns:repeat(${width}, ${cellSize}px);grid-template-rows:repeat(${height}, ${cellSize}px);--aa-cell-size:${cellSize}px;">`;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = cellByXY.get(`${x},${y}`);
        const isSel = state.selectedCell && state.selectedCell.x === x && state.selectedCell.y === y;
        const cls = ["aa-cell"];
        if (cell?.type) cls.push(`aa-cell--${cell.type}`);
        if (isSel) cls.push("is-selected");
        const ic = cell ? CELL_STYLES[cell.type]?.icon : null;
        html += `<div class="${cls.join(' ')}" data-x="${x}" data-y="${y}">`;
        if (ic) html += iconHTML(ic, { size: Math.max(10, Math.floor(cellSize * 0.5)), color: CELL_STYLES[cell.type]?.iconColor });
        html += `</div>`;
      }
    }
    html += `</div>`;
    target.innerHTML = html;
  };

  render();

  // Pointer events for paint-and-drag
  target.addEventListener("mousedown", (e) => {
    const cell = e.target.closest("[data-x][data-y]");
    if (!cell) return;
    const x = parseInt(cell.dataset.x, 10);
    const y = parseInt(cell.dataset.y, 10);
    isDragging = true;
    handleAction(x, y);
  });
  target.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const cell = e.target.closest("[data-x][data-y]");
    if (!cell) return;
    const x = parseInt(cell.dataset.x, 10);
    const y = parseInt(cell.dataset.y, 10);
    if (state.tool === "select") return; // no drag-select
    handleAction(x, y);
  });
  document.addEventListener("mouseup", () => { isDragging = false; });

  // Touch events (basic): single tap as click
  target.addEventListener("touchstart", (e) => {
    const cell = e.target.closest("[data-x][data-y]");
    if (!cell) return;
    const x = parseInt(cell.dataset.x, 10);
    const y = parseInt(cell.dataset.y, 10);
    handleAction(x, y);
  }, { passive: true });

  function handleAction(x, y) {
    if (state.tool === "select") {
      handlers.onCellSelect?.({ x, y });
    } else if (state.tool === "eraser") {
      handlers.onCellErase?.({ x, y });
    } else {
      // Paint
      handlers.onCellPaint?.({ x, y });
    }
  }

  return {
    update(partial) {
      state = { ...state, ...partial };
      render();
    },
  };
}
