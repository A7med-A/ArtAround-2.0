// ═══════════════════════════════════════════════════════════════
// useTourCommands — traduce un'azione (vocale o da pulsante) in una
// modifica dello stato della visita, con la conferma da mostrare.
//
// È il punto unico in cui vive la semantica dei comandi: l'overlay
// vocale, i pulsanti grandi e la mappa passano tutti da qui, quindi
// "dimmi di più" fa esattamente la stessa cosa comunque sia invocato.
// ═══════════════════════════════════════════════════════════════

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMuseum } from "@/context/MuseumContext";
import { useTour } from "@/context/TourContext";
import { useToast } from "@/context/ToastContext";
import { DURATION_LABELS, TONE_LABELS } from "@/constants/schema";
import { ROUTES } from "@/constants/config";

/** Comandi vocali che chiedono di localizzare un servizio sulla mappa. */
const SERVICE_ACTIONS = { toilet: "bagno", exit: "uscita", bar: "bar" };

/**
 * @param {object} playerRef  ref all'AudioPlayer, per "ripeti" e "pausa"
 * @returns {{ runCommand: (action: string) => void, isDisabled: (action) => boolean }}
 */
export default function useTourCommands(playerRef) {
  const navigate = useNavigate();
  const { slug, floors } = useMuseum();
  const { showToast } = useToast();
  const tour = useTour();

  const runCommand = useCallback(
    (action) => {
      switch (action) {
        case "next": {
          if (!tour.next()) showToast("Hai completato la visita!", "success");
          break;
        }
        case "prev": {
          if (!tour.prev()) showToast("Sei già alla prima opera");
          break;
        }
        case "more":
        case "less": {
          const dir = action === "more" ? 1 : -1;
          const next = tour.adjustLength(dir);
          if (!next) {
            showToast(
              dir > 0
                ? "Non c'è una versione più estesa di questa opera"
                : "Non c'è una versione più breve di questa opera",
            );
          } else if (next.toneChanged) {
            // L'autore non ha scritto quella lunghezza per il livello corrente:
            // avvisiamo che è cambiato anche il registro del racconto.
            showToast(
              `Racconto ${DURATION_LABELS[next.duration].toLowerCase()} · livello ${TONE_LABELS[
                next.tone
              ].toLowerCase()}`,
            );
          } else {
            showToast(`Racconto ${DURATION_LABELS[next.duration].toLowerCase()}`);
          }
          break;
        }
        case "simpler": {
          const next = tour.adjustTone(-1);
          showToast(
            next
              ? `Livello: ${TONE_LABELS[next]}`
              : "Questa è già la versione più semplice disponibile",
          );
          break;
        }
        case "harder": {
          const next = tour.adjustTone(1);
          showToast(
            next
              ? `Livello: ${TONE_LABELS[next]}`
              : "Questa è già la versione più approfondita disponibile",
          );
          break;
        }
        case "repeat": {
          playerRef?.current?.play();
          showToast("Riascolto dall'inizio");
          break;
        }
        case "pause": {
          playerRef?.current?.pause();
          break;
        }
        case "map": {
          navigate(ROUTES.map(slug));
          break;
        }
        default: {
          const serviceType = SERVICE_ACTIONS[action];
          if (serviceType) navigate(`${ROUTES.map(slug)}?servizio=${serviceType}`);
        }
      }
    },
    [tour, showToast, navigate, slug, playerRef],
  );

  /**
   * Un comando è disattivato quando il museo non offre quel servizio:
   * meglio mostrarlo spento che mandare il visitatore su una mappa vuota.
   */
  const isDisabled = useCallback(
    (action) => {
      const serviceType = SERVICE_ACTIONS[action];
      if (!serviceType) return false;
      return !floors.some((floor) =>
        (floor.cells || []).some((cell) => cell.type === serviceType),
      );
    },
    [floors],
  );

  return { runCommand, isDisabled };
}
