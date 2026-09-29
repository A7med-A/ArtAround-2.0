// ═══════════════════════════════════════════════════════════════
// MAP VIEW — Map Editor
// ═══════════════════════════════════════════════════════════════

import { store } from "../core/store.js";
import { auth } from "../core/auth.js";
import { museumsService } from "../services/museums.service.js";
import { itemsService } from "../services/items.service.js";
import { toast } from "../ui/toast.js";
import { iconHTML } from "../ui/icon.js";
import {
  cloneFloors,
  emptyFloor,
  reorderFloors,
  setCell,
  eraseCell,
  resizeFloor,
  TOOLS,
} from "../utils/map.js";
import { mountMapToolbar } from "../ui/map-toolbar.js";
import { mountFloorTabs } from "../ui/floor-tabs.js";
import { mountMapGrid } from "../ui/map-grid.js";
import { mountCellDetailPanel } from "../ui/cell-detail-panel.js";

let _activeSlug = null;
let _museum = null;
let _floors = [];
let _floorIndex = 0;
let _tool = "select";
let _zoom = 1;
let _selected = null;
let _allItems = [];
let _itemMap = new Map();
let _dirty = false;
let _undoStack = [];
let _redoStack = [];

let _toolbar, _tabs, _grid, _panel;

export async function render() {
  const outlet = document.getElementById("app-outlet");
  _activeSlug = store.activeMuseum.get();
  _selected = null;
  _undoStack = [];
  _redoStack = [];
  _dirty = false;

  if (!_activeSlug) {
    const isAuthorWithoutMuseums = auth.isAuthor() && (auth.myMuseumSlugs() || []).length === 0;
    outlet.innerHTML = `
      <div class="aa-empty" style="padding:60px 20px;">
        ${iconHTML(isAuthorWithoutMuseums ? "lock" : "map", { size: 32, color: "var(--t-textMuted)" })}
        <div class="aa-empty__title">${isAuthorWithoutMuseums ? "Nessun museo assegnato" : "Nessun museo selezionato"}</div>
        <div class="aa-empty__msg">${isAuthorWithoutMuseums
          ? "Il tuo account non ha ancora accesso a nessun museo. Chiedi a un amministratore di concederti l'accesso."
          : "Scegli un museo dalla sidebar per gestire la sua mappa."}</div>
      </div>
    `;
    return;
  }

  outlet.innerHTML = `<div style="padding:60px;display:flex;justify-content:center;"><div class="aa-spinner"></div></div>`;

  try {
    [_museum, _allItems] = await Promise.all([
      museumsService.getBySlug(_activeSlug),
      itemsService.listByMuseum(_activeSlug).catch(() => []),
    ]);
    _floors = (_museum.floors || []).map((f) => ({ ...f, cells: [...(f.cells || [])] }));
    _allItems = _allItems || [];
    _itemMap = new Map(_allItems.map((it) => [String(it._id), it]));
    _floorIndex = 0;
    if (_floors.length === 0) _floors = [emptyFloor(0)];
  } catch (err) {
    console.error(err);
    outlet.innerHTML = `
      <div class="aa-empty" style="padding:40px;">
        <div class="aa-empty__icon">${iconHTML("close", { size: 22 })}</div>
        <div class="aa-empty__title">Errore</div>
        <div class="aa-empty__msg">${err.message || "Impossibile caricare il museo"}</div>
      </div>
    `;
    return;
  }

  outlet.innerHTML = `
    <div class="aa-map-page">
      <div data-slot="toolbar"></div>
      <div data-slot="tabs"></div>
      <div class="aa-map-body">
        <div class="aa-map-grid-wrap" data-slot="grid"></div>
        <div data-slot="panel"></div>
      </div>
    </div>
  `;

  _toolbar = mountMapToolbar(outlet.querySelector('[data-slot="toolbar"]'),
    { activeTool: _tool, zoom: _zoom, canUndo: false, canRedo: false, dirty: false },
    {
      onToolChange: (id) => {
        _tool = id;
        _toolbar.update({ activeTool: _tool });
        _grid.update({ tool: _tool });
        if (_tool !== "select") {
          _selected = null;
          _grid.update({ selectedCell: null });
          _panel.update({ selectedCell: null });
        }
      },
      onZoomIn:   () => { _zoom = Math.min(3, _zoom + 0.2); applyZoom(); },
      onZoomOut:  () => { _zoom = Math.max(0.4, _zoom - 0.2); applyZoom(); },
      onZoomReset:() => { _zoom = 1; applyZoom(); },
      onUndo:     () => undo(),
      onRedo:     () => redo(),
      onSave:     () => save(),
    });

  _tabs = mountFloorTabs(outlet.querySelector('[data-slot="tabs"]'),
    { floors: _floors, activeIndex: _floorIndex },
    {
      onFloorSelect: (i) => selectFloor(i),
      onFloorAdd:    () => addFloor(),
      onFloorRemove: (i) => removeFloor(i),
      onFloorRename: (i, name) => renameFloor(i, name),
    });

  _grid = mountMapGrid(outlet.querySelector('[data-slot="grid"]'),
    { floor: _floors[_floorIndex], tool: _tool, selectedCell: _selected, zoom: _zoom },
    {
      onCellPaint:  (xy) => paintCell(xy),
      onCellErase:  (xy) => eraseCellAt(xy),
      onCellSelect: (xy) => selectCell(xy),
    });

  _panel = mountCellDetailPanel(outlet.querySelector('[data-slot="panel"]'),
    { floor: _floors[_floorIndex], selectedCell: _selected, allItems: _allItems },
    {
      onCellUpdate:  (e) => updateCell(e),
      onCellClear:   (e) => eraseCellAt(e),
      onFloorResize: (d) => resizeActiveFloor(d),
    });

  // Keyboard shortcuts
  document.addEventListener("keydown", _kbHandler);
}

const _kbHandler = (e) => {
  if (store.section.get() !== "map") return;
  const tag = (e.target || {}).tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  const isMac = navigator.platform.toUpperCase().includes("MAC");
  const cmd = isMac ? e.metaKey : e.ctrlKey;
  if (!cmd) return;
  if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
  else if ((e.key === "z" && e.shiftKey) || e.key === "y") { e.preventDefault(); redo(); }
  else if (e.key === "s") { e.preventDefault(); save(); }
};

function syncTabs() { _tabs?.update({ floors: _floors, activeIndex: _floorIndex }); }
function syncGrid() {
  _grid?.update({ floor: _floors[_floorIndex] || null, tool: _tool, selectedCell: _selected, zoom: _zoom });
}
function syncPanel() {
  _panel?.update({ floor: _floors[_floorIndex] || null, selectedCell: _selected, allItems: _allItems });
}
function syncToolbar() {
  _toolbar?.update({ activeTool: _tool, zoom: _zoom, canUndo: _undoStack.length > 0, canRedo: _redoStack.length > 0, dirty: _dirty });
}
function syncAll() { syncTabs(); syncGrid(); syncPanel(); syncToolbar(); }
function applyZoom() { _grid?.update({ zoom: _zoom }); syncToolbar(); }

// ─── Floor management ──────────────────────────────────────
function selectFloor(i) {
  if (i < 0 || i >= _floors.length || i === _floorIndex) return;
  _floorIndex = i;
  _selected = null;
  syncAll();
}
function addFloor() {
  pushUndo();
  _floors = [..._floors, emptyFloor(_floors.length, `Piano ${_floors.length + 1}`)];
  _floorIndex = _floors.length - 1;
  _dirty = true;
  syncAll();
}
function removeFloor(i) {
  if (_floors.length <= 1) return toast("Un museo deve avere almeno un piano", "danger");
  if (!confirm(`Eliminare "${_floors[i].name}"?`)) return;
  pushUndo();
  _floors = reorderFloors(_floors.filter((_, idx) => idx !== i));
  _floorIndex = Math.min(_floorIndex, _floors.length - 1);
  _selected = null;
  _dirty = true;
  syncAll();
}
function renameFloor(i, name) {
  pushUndo();
  _floors = _floors.map((f, idx) => idx === i ? { ...f, name } : f);
  _dirty = true;
  syncAll();
}
function resizeActiveFloor({ width, height }) {
  const floor = _floors[_floorIndex];
  if (!floor) return;
  const resized = resizeFloor(floor, width, height);
  if (resized.width === floor.width && resized.height === floor.height) return;
  pushUndo();
  const dropped = floor.cells.length - resized.cells.length;
  _floors = _floors.map((f, idx) => idx === _floorIndex ? resized : f);
  if (_selected && (_selected.x >= resized.width || _selected.y >= resized.height)) _selected = null;
  _dirty = true;
  syncAll();
  toast(dropped > 0
    ? `Piano ridimensionato (${resized.width}×${resized.height}). ${dropped} cella/e rimossa/e.`
    : `Piano ridimensionato a ${resized.width}×${resized.height}.`,
    dropped > 0 ? "info" : "success");
}

// ─── Cell ops ──────────────────────────────────────────────
function paintCell({ x, y }) {
  const floor = _floors[_floorIndex];
  if (!floor) return;
  const toolDef = TOOLS.find((t) => t.id === _tool);
  if (!toolDef || !toolDef.isType) return;
  pushUndo();
  const patch = { type: _tool };
  if (_tool === "item") patch.itemId = null;
  const newCells = setCell(floor.cells, x, y, patch);
  _floors = _floors.map((f, i) => i === _floorIndex ? { ...f, cells: newCells } : f);
  _dirty = true;
  syncGrid(); syncPanel(); syncToolbar();
}
function eraseCellAt({ x, y }) {
  const floor = _floors[_floorIndex];
  if (!floor) return;
  pushUndo();
  const newCells = eraseCell(floor.cells, x, y);
  _floors = _floors.map((f, i) => i === _floorIndex ? { ...f, cells: newCells } : f);
  _dirty = true;
  syncGrid(); syncPanel(); syncToolbar();
}
function selectCell({ x, y }) {
  _selected = { x, y };
  syncGrid(); syncPanel();
}
function updateCell({ x, y, patch }) {
  const floor = _floors[_floorIndex];
  if (!floor) return;
  pushUndo();
  if (patch.itemId === "") patch.itemId = null;
  const newCells = setCell(floor.cells, x, y, patch);
  _floors = _floors.map((f, i) => i === _floorIndex ? { ...f, cells: newCells } : f);
  _dirty = true;
  syncGrid(); syncPanel(); syncToolbar();
}

// ─── Undo/Redo ─────────────────────────────────────────────
function pushUndo() {
  _undoStack.push(cloneFloors(_floors));
  if (_undoStack.length > 50) _undoStack.shift();
  _redoStack = [];
}
function undo() {
  if (!_undoStack.length) return;
  _redoStack.push(cloneFloors(_floors));
  _floors = _undoStack.pop();
  _floorIndex = Math.min(_floorIndex, _floors.length - 1);
  _selected = null;
  _dirty = true;
  syncAll();
}
function redo() {
  if (!_redoStack.length) return;
  _undoStack.push(cloneFloors(_floors));
  _floors = _redoStack.pop();
  _floorIndex = Math.min(_floorIndex, _floors.length - 1);
  _selected = null;
  _dirty = true;
  syncAll();
}

// ─── Save ─────────────────────────────────────────────────
async function save() {
  if (!_dirty) return toast("Nessuna modifica da salvare", "info");
  const incomplete = [];
  _floors.forEach((f) => {
    f.cells.forEach((c) => {
      if (c.type === "item" && !c.itemId) incomplete.push({ floor: f.name, x: c.x, y: c.y });
    });
  });
  if (incomplete.length) {
    const sample = incomplete.slice(0, 3).map((c) => `${c.floor} (${c.x},${c.y})`).join(", ");
    return toast(`${incomplete.length} celle "Opera" senza item: ${sample}${incomplete.length > 3 ? "…" : ""}`, "danger");
  }
  try {
    const updated = await museumsService.patch(_activeSlug, { floors: _floors });
    _museum = updated;
    _floors = (updated.floors || []).map((f) => ({ ...f, cells: [...(f.cells || [])] }));
    _floorIndex = Math.min(_floorIndex, _floors.length - 1);
    _undoStack = []; _redoStack = []; _dirty = false;
    toast("Mappa salvata", "success");
    syncAll();
  } catch (err) {
    console.error(err);
    toast(err.message || "Errore nel salvataggio", "danger");
  }
}
