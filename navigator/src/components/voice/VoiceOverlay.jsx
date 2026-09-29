import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import Overlay from "@/components/ui/Overlay";
import useVoiceRecognition from "@/hooks/useVoiceRecognition";
import { VOICE_COMMANDS } from "@/constants/voiceCommands";
import styles from "./Voice.module.css";

/**
 * Assistente vocale.
 *
 * Ascolta dal microfono dove il browser lo consente, ma i comandi restano
 * sempre toccabili: in un museo affollato dettare a voce non è detto sia
 * praticabile, e su iOS il riconoscimento continuo spesso non è disponibile.
 *
 * @param {(action: string) => (string|void)} onCommand
 *        esegue l'azione; può restituire un messaggio di conferma
 */
export default function VoiceOverlay({ onClose, onCommand, disabledActions = [] }) {
  const [recognized, setRecognized] = useState(null);

  const runCommand = useCallback(
    (command) => {
      setRecognized(command);
      // Breve pausa: il visitatore vede quale comando è stato capito
      // prima che la schermata cambi sotto le sue mani.
      setTimeout(() => {
        onCommand?.(command.action);
        onClose?.();
      }, 550);
    },
    [onCommand, onClose],
  );

  const recognition = useVoiceRecognition({ onCommand: runCommand });

  // Avvia l'ascolto all'apertura; l'hook si ferma da solo allo smontaggio.
  const { start, stop, supported } = recognition;
  useEffect(() => {
    if (supported) start();
    return stop;
  }, [supported, start, stop]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const heading = recognized
    ? recognized.label
    : recognition.listening
      ? "Sto ascoltando…"
      : "Assistente vocale";

  const hint = recognized
    ? "Comando riconosciuto ✓"
    : recognition.transcript
      ? `“${recognition.transcript}”`
      : recognition.supported
        ? "Pronuncia un comando oppure toccalo qui sotto"
        : "Tocca uno dei comandi qui sotto";

  return (
    <Overlay>
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Assistente vocale">
      <button type="button" className={styles.close} onClick={onClose} aria-label="Chiudi">
        <Icon name="close" size={20} color="var(--text)" />
      </button>

      <div className={styles.stage}>
        <button
          type="button"
          className={styles.micWrap}
          onClick={recognition.listening ? recognition.stop : recognition.start}
          aria-label={recognition.listening ? "Interrompi l'ascolto" : "Avvia l'ascolto"}
        >
          {recognition.listening && (
            <>
              <span className={styles.pulse} />
              <span className={[styles.pulse, styles.pulseDelayed].join(" ")} />
            </>
          )}
          <span
            className={[styles.micDisc, !recognition.listening && styles.micIdle]
              .filter(Boolean)
              .join(" ")}
          >
            <Icon
              name={recognition.supported ? "mic" : "micOff"}
              size={34}
              color={recognition.listening ? "var(--onGold)" : "var(--textSec)"}
            />
          </span>
        </button>

        <div className={styles.heading}>{heading}</div>
        <div className={styles.hint}>{hint}</div>
        {recognition.error && <div className={styles.error}>{recognition.error}</div>}
      </div>

      <div className={styles.commands}>
        <div className={styles.commandsTitle}>Comandi disponibili</div>
        <div className={styles.grid}>
          {VOICE_COMMANDS.map((command) => {
            const active = recognized?.action === command.action;
            const disabled = disabledActions.includes(command.action);
            return (
              <button
                key={command.action}
                type="button"
                disabled={disabled}
                className={[
                  styles.command,
                  active && styles.commandActive,
                  disabled && styles.commandDisabled,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => runCommand(command)}
              >
                <Icon
                  name={command.icon}
                  size={16}
                  color={active ? "var(--onGold)" : "var(--gold)"}
                />
                {command.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
    </Overlay>
  );
}
