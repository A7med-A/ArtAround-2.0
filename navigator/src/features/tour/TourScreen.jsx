import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Screen, { ScreenBody } from "@/components/layout/Screen";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import BigButton from "@/components/ui/BigButton";
import ProgressBar from "@/components/ui/ProgressBar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/StateView";
import VoiceButton from "@/components/voice/VoiceButton";
import VoiceOverlay from "@/components/voice/VoiceOverlay";
import { useMuseum } from "@/context/MuseumContext";
import { useTour } from "@/context/TourContext";
import { VOICE_COMMANDS } from "@/constants/voiceCommands";
import { ROUTES } from "@/constants/config";
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";
import useTourCommands from "./useTourCommands";
import ArrivalPanel from "./ArrivalPanel";
import ArtworkPanel from "./ArtworkPanel";
import styles from "./TourScreen.module.css";

/**
 * Schermata principale della visita.
 *
 * Ha due stati: avvicinamento (dove si trova l'opera e come arrivarci) e
 * ascolto (contenuti dell'opera). Il passaggio avviene quando il visitatore
 * conferma di essere arrivato.
 */
export default function TourScreen() {
  const navigate = useNavigate();
  const { slug, visits } = useMuseum();
  const tour = useTour();

  const playerRef = useRef(null);
  const { runCommand, isDisabled } = useTourCommands(playerRef);

  const [voiceOpen, setVoiceOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);

  const disabledActions = useMemo(
    () => VOICE_COMMANDS.map((c) => c.action).filter(isDisabled),
    [isDisabled],
  );

  // Scorciatoie da tastiera: l'equivalente desktop dei comandi grandi.
  // Sospese quando un overlay è aperto, per non agire "sotto" al modale.
  const shortcuts = useMemo(
    () => ({
      ArrowRight: () => runCommand("next"),
      ArrowLeft: () => runCommand("prev"),
      ArrowUp: () => runCommand("more"),
      ArrowDown: () => runCommand("less"),
      " ": () => playerRef.current?.toggle(),
      r: () => runCommand("repeat"),
      v: () => setVoiceOpen(true),
    }),
    [runCommand],
  );
  useKeyboardShortcuts(shortcuts, !voiceOpen && !exitOpen);

  const closeVoice = useCallback(() => setVoiceOpen(false), []);

  // ── Nessuna visita in corso ────────────────────────────────────

  if (!tour.isActive) {
    return (
      <EmptyState
        icon="headphones"
        title="Nessuna visita attiva"
        message="Scegli un percorso guidato per un itinerario passo passo con audioguida e livelli di approfondimento. Nel frattempo puoi esplorare la mappa o sfogliare le opere."
        action={
          <Button
            variant="primary"
            onClick={() =>
              navigate(visits.length > 0 ? ROUTES.visits(slug) : ROUTES.artworks(slug))
            }
          >
            {visits.length > 0 ? "Scegli una visita" : "Sfoglia le opere"}
          </Button>
        }
      />
    );
  }

  // ── Fase di avvicinamento ──────────────────────────────────────
  // Salta se l'opera non è collocata sulla pianta: senza posizione non
  // avrebbe nulla da mostrare.
  const showApproach = !tour.arrived && Boolean(tour.placement);

  const exitTour = () => {
    playerRef.current?.stop();
    tour.endTour();
    setExitOpen(false);
    navigate(tour.isFree ? ROUTES.artworks(slug) : ROUTES.visits(slug));
  };

  const exitDialog = exitOpen && (
    <ConfirmDialog
      icon="exit"
      title={tour.isFree ? "Chiudere l'ascolto libero?" : "Uscire dalla visita?"}
      message={
        tour.isFree
          ? "Tornerai all'elenco delle opere."
          : "Tornerai all'elenco delle visite. Il punto in cui sei arrivato non verrà conservato."
      }
      confirmLabel={tour.isFree ? "Chiudi" : "Esci dalla visita"}
      cancelLabel="Continua la visita"
      onConfirm={exitTour}
      onCancel={() => setExitOpen(false)}
    />
  );

  const voiceOverlay = voiceOpen && (
    <VoiceOverlay
      onClose={closeVoice}
      onCommand={runCommand}
      disabledActions={disabledActions}
    />
  );

  if (showApproach) {
    return (
      <Screen className={styles.tourScreen}>
        <ArrivalPanel onVoice={() => setVoiceOpen(true)} />
        {voiceOverlay}
        {exitDialog}
      </Screen>
    );
  }

  // ── Fase di ascolto ────────────────────────────────────────────

  return (
    <Screen className={styles.tourScreen}>
      <div className={styles.head}>
        <div className={styles.headInner}>
          <div className={styles.headRow}>
            <div className={styles.headLeft}>
              <button
                type="button"
                className={styles.exitBtn}
                onClick={() => setExitOpen(true)}
                aria-label="Esci dalla visita"
              >
                <Icon name="chevL" size={18} color="var(--textSec)" />
              </button>
              <div className={styles.headTexts}>
                <div className={styles.visitTitle}>{tour.visitTitle}</div>
                <div className={styles.stopCounter}>
                  Tappa {tour.stopIndex + 1} di {tour.totalStops}
                </div>
              </div>
            </div>
            <VoiceButton onClick={() => setVoiceOpen(true)} />
          </div>
          <ProgressBar value={tour.stopIndex + 1} max={tour.totalStops} />
        </div>
      </div>

      <ScreenBody>
        <ArtworkPanel
          item={tour.currentItem}
          content={tour.content}
          prefs={tour.prefs}
          placement={tour.placement}
          playerRef={playerRef}
          onTone={tour.setTone}
          onDuration={tour.setDuration}
          onRate={tour.setRate}
          onOpenDetail={() =>
            navigate(ROUTES.artwork(slug, tour.currentItem._id), {
              state: { from: "tour" },
            })
          }
        />
      </ScreenBody>

      <div className={styles.controls}>
        <div className={styles.controlsInner}>
        <div className={styles.controlRow}>
          <BigButton
            icon="plus"
            label="Di più"
            sub="testo esteso"
            onClick={() => runCommand("more")}
          />
          <BigButton
            icon="minus"
            label="Di meno"
            sub="più conciso"
            onClick={() => runCommand("less")}
          />
          <BigButton
            icon="info"
            label="Più facile"
            sub="semplifica"
            onClick={() => runCommand("simpler")}
          />
          <BigButton
            icon="book"
            label="Avanzato"
            sub="approfondisci"
            onClick={() => runCommand("harder")}
          />
        </div>
        <div className={styles.controlRow}>
          <BigButton
            icon="prev"
            label="Precedente"
            disabled={tour.stopIndex === 0}
            onClick={() => runCommand("prev")}
          />
          <BigButton
            icon="next"
            label={tour.isLast ? "Fine visita" : "Prossima"}
            primary
            onClick={() => runCommand("next")}
          />
        </div>
        </div>
      </div>

      {voiceOverlay}
      {exitDialog}
    </Screen>
  );
}
