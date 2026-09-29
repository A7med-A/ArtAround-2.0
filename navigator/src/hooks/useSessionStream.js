// ═══════════════════════════════════════════════════════════════
// useSessionStream — connessione SSE alla sessione guidata.
//
// Il server tiene aperta una risposta HTTP e vi scrive gli eventi:
// quando il docente cambia tappa, tutti gli auricolari della classe si
// allineano nello stesso istante senza che nessuno debba interrogare
// il server a intervalli.
//
// EventSource riconnette da solo dopo un'interruzione di rete; noi ci
// occupiamo di ricostruire lo stato aggiornato al rientro, perché nel
// frattempo il docente può essere andata avanti.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react";
import { sessionsApi } from "@/api";

/**
 * @param {string} code       codice della sessione
 * @param {string} streamKey  chiave del partecipante
 * @param {Object<string,Function>} handlers  nome evento → callback
 * @returns {{ connected: boolean, error: string|null }}
 */
export default function useSessionStream(code, streamKey, handlers) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  // I gestori cambiano a ogni render: teniamoli in un ref, così la
  // connessione non viene chiusa e riaperta di continuo.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!code || !streamKey) return undefined;

    const source = new EventSource(sessionsApi.streamUrl(code, streamKey));
    const listeners = [];

    source.onopen = () => {
      setConnected(true);
      setError(null);
    };

    source.onerror = () => {
      // EventSource ritenta da solo: segnaliamo lo stato senza chiudere.
      setConnected(false);
      setError("Connessione interrotta, riprovo…");
    };

    for (const name of Object.keys(handlersRef.current || {})) {
      const listener = (event) => {
        let payload = null;
        try {
          payload = event.data ? JSON.parse(event.data) : null;
        } catch {
          payload = null;
        }
        handlersRef.current?.[name]?.(payload);
      };
      source.addEventListener(name, listener);
      listeners.push([name, listener]);
    }

    return () => {
      listeners.forEach(([name, listener]) => source.removeEventListener(name, listener));
      source.close();
      setConnected(false);
    };
    // Volutamente solo su code/streamKey: i gestori vivono nel ref, così
    // cambiarli non chiude e riapre la connessione.
  }, [code, streamKey]);

  return { connected, error };
}
