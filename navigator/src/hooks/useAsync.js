// ═══════════════════════════════════════════════════════════════
// useAsync — esegue una funzione asincrona e ne espone lo stato.
// Annulla l'aggiornamento se il componente si smonta o se le
// dipendenze cambiano prima che la richiesta si concluda.
// ═══════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * @param {Function} asyncFn  funzione che ritorna una Promise
 * @param {Array} deps        dipendenze che fanno ripartire la richiesta
 * @returns {{ data, loading, error, reload }}
 */
export default function useAsync(asyncFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const fnRef = useRef(asyncFn);
  fnRef.current = asyncFn;

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fnRef
      .current()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Errore imprevisto");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  return { data, loading, error, reload };
}
