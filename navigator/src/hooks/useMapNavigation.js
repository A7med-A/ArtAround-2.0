// ═══════════════════════════════════════════════════════════════
// useMapNavigation — zoom, pan e gesti sulla pianta del museo.
// Gestisce mouse (trascinamento + rotellina) e touch (trascinamento +
// pizzico), tenendo la logica fuori dal componente di rendering.
// ═══════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

const clamp = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
const pinchDistance = (touches) =>
  Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

export default function useMapNavigation(initialZoom = 1) {
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const containerRef = useRef(null);
  const dragOrigin = useRef(null);
  const pinchOrigin = useRef(null);

  const zoomIn = useCallback(() => setZoom((z) => clamp(z + 0.25)), []);
  const zoomOut = useCallback(() => setZoom((z) => clamp(z - 0.25)), []);
  const reset = useCallback(() => {
    setZoom(initialZoom);
    setPan({ x: 0, y: 0 });
  }, [initialZoom]);

  // ── Mouse ──────────────────────────────────────────────────────

  const onMouseDown = useCallback(
    (e) => {
      dragOrigin.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      setDragging(true);
    },
    [pan],
  );

  const onMouseMove = useCallback((e) => {
    if (!dragOrigin.current) return;
    setPan({ x: e.clientX - dragOrigin.current.x, y: e.clientY - dragOrigin.current.y });
  }, []);

  const endDrag = useCallback(() => {
    dragOrigin.current = null;
    pinchOrigin.current = null;
    setDragging(false);
  }, []);

  // ── Touch ──────────────────────────────────────────────────────

  const onTouchStart = useCallback(
    (e) => {
      if (e.touches.length === 2) {
        pinchOrigin.current = { distance: pinchDistance(e.touches), zoom };
        dragOrigin.current = null;
        return;
      }
      const touch = e.touches[0];
      dragOrigin.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
      setDragging(true);
    },
    [pan, zoom],
  );

  const onTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && pinchOrigin.current) {
      const ratio = pinchDistance(e.touches) / pinchOrigin.current.distance;
      setZoom(clamp(pinchOrigin.current.zoom * ratio));
      return;
    }
    if (!dragOrigin.current) return;
    const touch = e.touches[0];
    setPan({ x: touch.clientX - dragOrigin.current.x, y: touch.clientY - dragOrigin.current.y });
  }, []);

  // ── Rotellina ──────────────────────────────────────────────────
  // Registrata a mano perché serve `passive: false` per bloccare
  // lo zoom della pagina mentre si zooma sulla pianta.

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const onWheel = (e) => {
      e.preventDefault();
      setZoom((z) => clamp(z * (e.deltaY > 0 ? 0.92 : 1.08)));
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  return {
    containerRef,
    zoom,
    pan,
    dragging,
    zoomIn,
    zoomOut,
    reset,
    setPan,
    handlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp: endDrag,
      onMouseLeave: endDrag,
      onTouchStart,
      onTouchMove,
      onTouchEnd: endDrag,
    },
  };
}
