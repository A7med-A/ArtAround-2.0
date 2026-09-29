import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Id del contenitore renderizzato da <AppShell>. */
export const OVERLAY_ROOT_ID = "aanav-overlays";

/**
 * Monta il contenuto nel livello overlay dell'app.
 *
 * Serve perché modali e pannelli devono coprire anche la navigazione
 * (barra in basso su mobile, colonna laterale su desktop), che sta
 * fuori dall'albero della schermata corrente.
 */
export default function Overlay({ children }) {
  const [host, setHost] = useState(null);

  // Il contenitore è renderizzato da AppShell: esiste solo dopo il primo
  // paint, quindi lo cerchiamo a montaggio avvenuto.
  useEffect(() => setHost(document.getElementById(OVERLAY_ROOT_ID)), []);

  if (!host) return null;
  return createPortal(children, host);
}
