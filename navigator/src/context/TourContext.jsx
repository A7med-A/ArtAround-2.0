// ═══════════════════════════════════════════════════════════════
// TOUR — stato della visita in corso.
//
// Il server non memorizza lo stato di avanzamento: una Visit è solo
// titolo, descrizione e sequenza ordinata di items. Il progresso vive
// qui e viene persistito in locale, così chiudere l'app o bloccare lo
// schermo non fa perdere la tappa raggiunta.
//
// Due modalità:
//   • guidata  — segue l'ordine di Visit.items
//   • libera   — tutte le opere del museo, senza percorso obbligato
// ═══════════════════════════════════════════════════════════════

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS, DEFAULT_PREFS } from "@/constants/config";
import { readJSON, writeJSON, remove } from "@/lib/storage";
import { resolveText, shiftLength, shiftTone } from "@/lib/content";
import { entryPoint, floorByOrder } from "@/lib/museumMap";
import { useMuseum } from "./MuseumContext";

const TourContext = createContext(null);

export const TOUR_MODES = { GUIDED: "guided", FREE: "free" };

const emptyTour = {
  mode: null,
  visitId: null,
  visitTitle: null,
  stopIds: [],
  stopIndex: 0,
  arrived: false,
};

function loadPrefs() {
  const saved = readJSON(STORAGE_KEYS.PREFS, null);
  return { ...DEFAULT_PREFS, ...(saved || {}) };
}

export function TourProvider({ children }) {
  const { slug, museum, items, floors, getItem, getPlacement } = useMuseum();

  const [tour, setTour] = useState(emptyTour);
  const [prefs, setPrefs] = useState(loadPrefs);
  const [position, setPosition] = useState(null);
  const [restored, setRestored] = useState(false);

  // ── Persistenza ────────────────────────────────────────────────

  // Ripristina la visita salvata per questo museo (una sola volta per slug).
  useEffect(() => {
    setRestored(false);
    if (!slug) return;
    const saved = readJSON(STORAGE_KEYS.TOUR, null);
    if (saved && saved.slug === slug && saved.tour?.mode) {
      setTour({ ...emptyTour, ...saved.tour });
      setPosition(saved.position || null);
    } else {
      setTour(emptyTour);
      setPosition(null);
    }
    setRestored(true);
  }, [slug]);

  useEffect(() => {
    if (!restored || !slug) return;
    if (!tour.mode) remove(STORAGE_KEYS.TOUR);
    else writeJSON(STORAGE_KEYS.TOUR, { slug, tour, position });
  }, [slug, tour, position, restored]);

  useEffect(() => {
    writeJSON(STORAGE_KEYS.PREFS, prefs);
  }, [prefs]);

  // Posizione iniziale: l'ingresso del primo piano del museo.
  useEffect(() => {
    if (position || floors.length === 0) return;
    const ground = floors[0];
    setPosition({ floorOrder: ground.order, ...entryPoint(ground) });
  }, [floors, position]);

  // ── Dati derivati ──────────────────────────────────────────────

  const stops = useMemo(
    () => tour.stopIds.map((id) => getItem(id)).filter(Boolean),
    [tour.stopIds, getItem],
  );

  const totalStops = stops.length;
  const stopIndex = Math.min(tour.stopIndex, Math.max(0, totalStops - 1));
  const currentItem = stops[stopIndex] || null;
  const placement = currentItem ? getPlacement(currentItem._id) : null;

  const content = useMemo(
    () => (currentItem ? resolveText(currentItem, prefs) : null),
    [currentItem, prefs],
  );

  const isActive = Boolean(tour.mode) && totalStops > 0;
  const isLast = totalStops > 0 && stopIndex >= totalStops - 1;

  /** Piano su cui si trova il visitatore in questo momento. */
  const currentFloor = useMemo(
    () => (museum && position ? floorByOrder(museum, position.floorOrder) : floors[0] || null),
    [museum, position, floors],
  );

  // ── Azioni: avvio e uscita ─────────────────────────────────────

  const startGuided = useCallback((visit) => {
    const ids = (visit?.items || []).map((it) => String(it?._id ?? it));
    setTour({
      mode: TOUR_MODES.GUIDED,
      visitId: String(visit._id),
      visitTitle: visit.title,
      stopIds: ids,
      stopIndex: 0,
      arrived: false,
    });
  }, []);

  const startFree = useCallback(
    (startItemId = null) => {
      const ids = items.map((it) => String(it._id));
      const from = startItemId ? ids.indexOf(String(startItemId)) : 0;
      setTour({
        mode: TOUR_MODES.FREE,
        visitId: null,
        visitTitle: "Ascolto libero",
        stopIds: ids,
        stopIndex: from < 0 ? 0 : from,
        // Chi sceglie un'opera precisa la sta già guardando: si salta la
        // fase di avvicinamento e si parte subito con il racconto.
        arrived: Boolean(startItemId),
      });
    },
    [items],
  );

  const endTour = useCallback(() => setTour(emptyTour), []);

  // ── Azioni: navigazione fra le tappe ───────────────────────────

  const goToStop = useCallback(
    (index, { arrived = false } = {}) =>
      setTour((t) => {
        const max = t.stopIds.length - 1;
        const clamped = Math.max(0, Math.min(max, index));
        return { ...t, stopIndex: clamped, arrived };
      }),
    [],
  );

  const goToItem = useCallback(
    (itemId, options) => {
      const index = tour.stopIds.indexOf(String(itemId));
      if (index >= 0) goToStop(index, options);
    },
    [tour.stopIds, goToStop],
  );

  /** @returns {boolean} false se era già l'ultima tappa. */
  const next = useCallback(() => {
    if (isLast) return false;
    goToStop(stopIndex + 1);
    return true;
  }, [isLast, stopIndex, goToStop]);

  /** @returns {boolean} false se era già la prima tappa. */
  const prev = useCallback(() => {
    if (stopIndex <= 0) return false;
    goToStop(stopIndex - 1);
    return true;
  }, [stopIndex, goToStop]);

  /** Il visitatore conferma di essere davanti all'opera: aggiorna la posizione. */
  const markArrived = useCallback(() => {
    setTour((t) => ({ ...t, arrived: true }));
    if (placement) {
      setPosition({ floorOrder: placement.floorOrder, x: placement.x, y: placement.y });
    }
  }, [placement]);

  // ── Azioni: livello di approfondimento ─────────────────────────

  const setTone = useCallback((tone) => setPrefs((p) => ({ ...p, tone })), []);
  const setDuration = useCallback((duration) => setPrefs((p) => ({ ...p, duration })), []);
  const setRate = useCallback((rate) => setPrefs((p) => ({ ...p, rate })), []);

  // Gli aggiustamenti partono dalla variante realmente in ascolto, non dalle
  // preferenze: se l'opera non ha la combinazione preferita, `content` contiene
  // quella effettivamente scelta ed è da lì che ha senso muoversi.

  /**
   * "Dimmi di più / di meno": allunga o accorcia il racconto.
   * @returns {{tone, duration, toneChanged}|null} null se non ci sono varianti.
   */
  const adjustLength = useCallback(
    (dir) => {
      if (!currentItem || !content) return null;
      const next = shiftLength(
        currentItem,
        { tone: content.tone, duration: content.duration },
        dir,
      );
      if (next) setPrefs((p) => ({ ...p, tone: next.tone, duration: next.duration }));
      return next;
    },
    [currentItem, content],
  );

  /**
   * "Non capisco / troppo semplice": cambia registro del racconto.
   * @returns {string|null} il nuovo tono, null se non ci sono varianti.
   */
  const adjustTone = useCallback(
    (dir) => {
      if (!currentItem || !content) return null;
      const nextTone = shiftTone(currentItem, content.tone, dir);
      if (nextTone) setTone(nextTone);
      return nextTone;
    },
    [currentItem, content, setTone],
  );

  const value = useMemo(
    () => ({
      // stato
      mode: tour.mode,
      visitId: tour.visitId,
      visitTitle: tour.visitTitle,
      arrived: tour.arrived,
      stops,
      stopIndex,
      totalStops,
      currentItem,
      placement,
      content,
      prefs,
      position,
      currentFloor,
      isActive,
      isLast,
      isFree: tour.mode === TOUR_MODES.FREE,
      // azioni
      startGuided,
      startFree,
      endTour,
      goToStop,
      goToItem,
      next,
      prev,
      markArrived,
      setPosition,
      setTone,
      setDuration,
      setRate,
      adjustLength,
      adjustTone,
    }),
    [
      tour, stops, stopIndex, totalStops, currentItem, placement, content, prefs,
      position, currentFloor, isActive, isLast, startGuided, startFree, endTour,
      goToStop, goToItem, next, prev, markArrived, setTone, setDuration, setRate,
      adjustLength, adjustTone,
    ],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour deve essere usato dentro <TourProvider>");
  return ctx;
}
