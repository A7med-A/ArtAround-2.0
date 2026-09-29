// ═══════════════════════════════════════════════════════════════
// MUSEUM — dati del museo attivo.
//
// Carica una sola volta museo + opere + percorsi per lo slug corrente e
// li condivide con tutte le schermate interne (visita, opere, mappa),
// evitando che ogni tab rifaccia le stesse tre richieste.
// ═══════════════════════════════════════════════════════════════

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { itemsApi, museumsApi, visitsApi } from "@/api";
import { buildPlacementIndex, sortedFloors } from "@/lib/museumMap";

const MuseumContext = createContext(null);

export function MuseumProvider({ slug, children }) {
  const [museum, setMuseum] = useState(null);
  const [items, setItems] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!slug) return undefined;
    let cancelled = false;

    setLoading(true);
    setError(null);

    Promise.all([
      museumsApi.fetchMuseum(slug),
      itemsApi.fetchItems(slug),
      visitsApi.fetchVisits(slug),
    ])
      .then(([museumData, itemsData, visitsData]) => {
        if (cancelled) return;
        setMuseum(museumData);
        setItems(itemsData || []);
        setVisits(visitsData || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Impossibile caricare il museo");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug, reloadKey]);

  // Indici derivati: ricalcolati solo quando cambiano davvero i dati.
  const itemsById = useMemo(() => {
    const map = new Map();
    for (const item of items) map.set(String(item._id), item);
    return map;
  }, [items]);

  const placements = useMemo(
    () => (museum ? buildPlacementIndex(museum) : new Map()),
    [museum],
  );

  const floors = useMemo(() => (museum ? sortedFloors(museum) : []), [museum]);

  /** Opera + posizione sulla mappa, se collocata. */
  const getItem = useCallback((id) => itemsById.get(String(id)) || null, [itemsById]);

  const getPlacement = useCallback((id) => placements.get(String(id)) || null, [placements]);

  const value = useMemo(
    () => ({
      slug,
      museum,
      items,
      visits,
      floors,
      loading,
      error,
      reload,
      getItem,
      getPlacement,
      placements,
    }),
    [slug, museum, items, visits, floors, loading, error, reload, getItem, getPlacement, placements],
  );

  return <MuseumContext.Provider value={value}>{children}</MuseumContext.Provider>;
}

export function useMuseum() {
  const ctx = useContext(MuseumContext);
  if (!ctx) throw new Error("useMuseum deve essere usato dentro <MuseumProvider>");
  return ctx;
}
