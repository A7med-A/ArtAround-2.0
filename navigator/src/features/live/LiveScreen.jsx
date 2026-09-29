import { useCallback, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Screen, { ScreenBody } from "@/components/layout/Screen";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import BigButton from "@/components/ui/BigButton";
import ProgressBar from "@/components/ui/ProgressBar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ErrorState, LoadingState } from "@/components/ui/StateView";
import VoiceButton from "@/components/voice/VoiceButton";
import VoiceOverlay from "@/components/voice/VoiceOverlay";
import ArtworkPanel from "@/features/tour/ArtworkPanel";
import { LiveSessionProvider, useLiveSession } from "@/context/LiveSessionContext";
import { useToast } from "@/context/ToastContext";
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";
import { shiftLength, shiftTone } from "@/lib/content";
import { DURATION_LABELS, TONE_LABELS } from "@/constants/schema";
import { ROUTES } from "@/constants/config";
import QuizPanel from "./QuizPanel";
import styles from "./LiveScreen.module.css";

/**
 * Comandi che nella visita guidata restano allo studente.
 * Spostarsi fra le opere no: la tappa la decide il docente, e i comandi
 * relativi compaiono disattivati invece di sparire, così è chiaro perché
 * non funzionano.
 */
const BLOCKED_COMMANDS = ["next", "prev", "toilet", "exit", "bar", "map"];

function LiveContent() {
  const navigate = useNavigate();
  const live = useLiveSession();
  const { showToast } = useToast();

  const playerRef = useRef(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const { session, currentItem, content, prefs } = live;

  // ── Comandi disponibili allo studente ──────────────────────────

  const runCommand = useCallback(
    (action) => {
      switch (action) {
        case "more":
        case "less": {
          if (!currentItem || !content) return;
          const next = shiftLength(
            currentItem,
            { tone: content.tone, duration: content.duration },
            action === "more" ? 1 : -1,
          );
          if (!next) {
            showToast(
              action === "more"
                ? "Non c'è una versione più estesa di questa opera"
                : "Non c'è una versione più breve di questa opera",
            );
            return;
          }
          live.setTone(next.tone);
          live.setDuration(next.duration);
          showToast(`Racconto ${DURATION_LABELS[next.duration].toLowerCase()}`);
          break;
        }
        case "simpler":
        case "harder": {
          if (!currentItem || !content) return;
          const nextTone = shiftTone(currentItem, content.tone, action === "harder" ? 1 : -1);
          if (!nextTone) {
            showToast(
              action === "harder"
                ? "Questa è già la versione più approfondita"
                : "Questa è già la versione più semplice",
            );
            return;
          }
          live.setTone(nextTone);
          showToast(`Livello: ${TONE_LABELS[nextTone]}`);
          break;
        }
        case "repeat": {
          playerRef.current?.play();
          live.reportReplay();
          showToast("Riascolto dall'inizio");
          break;
        }
        case "pause": {
          playerRef.current?.pause();
          break;
        }
        default:
          // Gli altri comandi non sono disponibili durante una visita guidata.
          showToast("Durante la visita guidata avanza il tuo insegnante");
      }
    },
    [currentItem, content, live, showToast],
  );

  const shortcuts = useMemo(
    () => ({
      ArrowUp: () => runCommand("more"),
      ArrowDown: () => runCommand("less"),
      " ": () => playerRef.current?.toggle(),
      r: () => runCommand("repeat"),
      v: () => setVoiceOpen(true),
    }),
    [runCommand],
  );
  useKeyboardShortcuts(shortcuts, !voiceOpen && !leaveOpen);

  // ── Stati di caricamento e uscita ──────────────────────────────

  if (live.loading) return <LoadingState message="Mi collego alla visita…" />;

  if (!live.membership) {
    return <Navigate to={ROUTES.JOIN} replace />;
  }

  if (!session) {
    return (
      <ErrorState
        title="Visita non raggiungibile"
        message={live.error || "La visita potrebbe essere stata chiusa dal tuo insegnante."}
        onRetry={() => navigate(ROUTES.JOIN, { replace: true })}
      />
    );
  }

  const leave = () => {
    playerRef.current?.stop();
    live.leave();
    navigate(ROUTES.MUSEUMS, { replace: true });
  };

  const header = (
    <div className={styles.head}>
      <div className={styles.headInner}>
        <div className={styles.headRow}>
          <div>
            <div className={styles.sessionName}>
              <span
                className={[styles.dot, !live.connected && styles.dotOffline]
                  .filter(Boolean)
                  .join(" ")}
                title={live.connected ? "Collegato" : "Riconnessione in corso"}
              />
              {live.membership.label}
            </div>
            <div className={styles.stopCounter}>
              {session.status === "in-corso" && live.items.length > 0
                ? `Opera ${live.stopIndex + 1} di ${live.items.length}`
                : `Sei collegato come ${live.membership.name}`}
            </div>
          </div>
          {session.status === "in-corso" ? (
            <VoiceButton onClick={() => setVoiceOpen(true)} />
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setLeaveOpen(true)}>
              Esci
            </Button>
          )}
        </div>
        {session.status === "in-corso" && live.items.length > 0 && (
          <ProgressBar value={live.stopIndex + 1} max={live.items.length} />
        )}
      </div>
    </div>
  );

  const overlays = (
    <>
      {voiceOpen && (
        <VoiceOverlay
          onClose={() => setVoiceOpen(false)}
          onCommand={runCommand}
          disabledActions={BLOCKED_COMMANDS}
        />
      )}
      {leaveOpen && (
        <ConfirmDialog
          icon="exit"
          title="Uscire dalla visita?"
          message="Il tuo insegnante ti vedrà come non collegato. Potrai rientrare digitando di nuovo il codice della visita."
          confirmLabel="Esci"
          cancelLabel="Resta"
          onConfirm={leave}
          onCancel={() => setLeaveOpen(false)}
        />
      )}
    </>
  );

  // ── In attesa che il docente cominci ───────────────────────────

  if (session.status === "attesa") {
    return (
      <Screen className={styles.liveScreen}>
        {header}
        <div className={styles.center}>
          <div className={styles.pulse}>
            <span className={styles.pulseRing} />
            <span className={styles.pulseCore}>
              <Icon name="headphones" size={26} color="var(--gold)" />
            </span>
          </div>
          <div className={styles.centerTitle}>Ci siamo quasi</div>
          <p className={styles.centerText}>
            Sei collegato. La visita comincerà quando il tuo insegnante darà il via:
            tieni gli auricolari a portata di mano.
          </p>
          <span className={styles.sessionTag}>
            <Icon name="star" size={14} color="var(--gold)" />
            {live.membership.label}
          </span>
        </div>
        {overlays}
      </Screen>
    );
  }

  // ── Quiz ───────────────────────────────────────────────────────

  if (session.status === "quiz") {
    return (
      <Screen className={styles.liveScreen}>
        {header}
        <ScreenBody>
          <QuizPanel />
        </ScreenBody>
        {overlays}
      </Screen>
    );
  }

  // ── Visita conclusa: esito ─────────────────────────────────────

  if (session.status === "conclusa") {
    const grade = live.myGrade;
    return (
      <Screen className={styles.liveScreen}>
        {header}
        <div className={styles.center}>
          <div className={styles.centerTitle}>Visita conclusa</div>
          {grade ? (
            <>
              <div className={styles.gradeCard}>
                <div className={styles.gradeMark}>{grade.mark}</div>
                <div className={styles.gradeScore}>
                  {grade.score} risposte corrette su {grade.max}
                </div>
                {grade.note && <div className={styles.gradeNote}>“{grade.note}”</div>}
              </div>
              <p className={styles.centerText}>Grazie per aver partecipato.</p>
            </>
          ) : (
            <p className={styles.centerText}>
              Il tuo insegnante non ha ancora pubblicato i risultati. Resta collegato
              ancora un momento.
            </p>
          )}
          <Button variant="secondary" onClick={leave}>
            Torna ai musei
          </Button>
        </div>
        {overlays}
      </Screen>
    );
  }

  // ── Visita in corso ────────────────────────────────────────────

  if (!currentItem) {
    return (
      <Screen className={styles.liveScreen}>
        {header}
        <ErrorState
          title="Nessuna opera in questa tappa"
          message="La visita non ha contenuti per questa posizione."
        />
        {overlays}
      </Screen>
    );
  }

  return (
    <Screen className={styles.liveScreen}>
      {header}

      <ScreenBody>
        <div className={styles.locked}>
          <Icon name="lock" size={16} color="var(--gold)" />
          Avanza il tuo insegnante. Tu puoi cambiare il livello e la lunghezza
          del racconto quando vuoi.
        </div>

        <ArtworkPanel
          item={currentItem}
          content={content}
          prefs={prefs}
          placement={null}
          playerRef={playerRef}
          onTone={live.setTone}
          onDuration={live.setDuration}
          onRate={live.setRate}
        />
      </ScreenBody>

      <div className={styles.controlsBar}>
        <BigButton icon="plus" label="Di più" sub="testo esteso" onClick={() => runCommand("more")} />
        <BigButton icon="minus" label="Di meno" sub="più conciso" onClick={() => runCommand("less")} />
        <BigButton icon="info" label="Più facile" sub="semplifica" onClick={() => runCommand("simpler")} />
        <BigButton icon="book" label="Avanzato" sub="approfondisci" onClick={() => runCommand("harder")} />
      </div>

      {overlays}
    </Screen>
  );
}

/** Radice della rotta /sessione/:code. */
export default function LiveScreen() {
  const { code } = useParams();
  return (
    <LiveSessionProvider code={code}>
      <LiveContent />
    </LiveSessionProvider>
  );
}
