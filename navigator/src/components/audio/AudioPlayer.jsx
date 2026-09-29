import { forwardRef, useImperativeHandle } from "react";
import Icon from "@/components/ui/Icon";
import useSpeech from "@/hooks/useSpeech";
import { formatClock } from "@/lib/format";
import { SPEECH_RATES } from "@/constants/config";
import styles from "./AudioPlayer.module.css";

/**
 * Audioguida: legge ad alta voce il testo dell'opera.
 *
 * Espone i controlli anche via ref, così i comandi vocali ("ripeti",
 * "pausa") possono pilotare la riproduzione senza duplicare lo stato.
 */
const AudioPlayer = forwardRef(function AudioPlayer(
  { text, rate = 1, onRateChange, onEnd },
  ref,
) {
  const speech = useSpeech({ text, rate, onEnd });

  useImperativeHandle(ref, () => speech, [speech]);

  const cycleRate = () => {
    const next = SPEECH_RATES[(SPEECH_RATES.indexOf(rate) + 1) % SPEECH_RATES.length];
    onRateChange?.(next);
  };

  const idle = !speech.playing && !speech.paused;
  const statusText = speech.playing
    ? "In riproduzione"
    : speech.paused
      ? "In pausa"
      : "Audioguida";

  return (
    <div className={styles.player}>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.mini}
          onClick={speech.stop}
          disabled={idle}
          aria-label="Ferma la lettura"
        >
          <Icon name="stop" size={16} color="var(--textSec)" fill="var(--textSec)" />
        </button>

        <button
          type="button"
          className={styles.main}
          onClick={speech.toggle}
          disabled={!text}
          aria-label={speech.playing ? "Metti in pausa" : "Ascolta"}
        >
          <Icon
            name={speech.playing ? "pause" : "play"}
            size={22}
            color="var(--onGold)"
            fill="var(--onGold)"
          />
        </button>

        <div className={styles.info}>
          <div className={styles.status}>
            <Icon name="headphones" size={14} color="var(--gold)" />
            <span className={styles.statusText}>{statusText}</span>
            {speech.playing && <span className={styles.blip} />}
          </div>
          <div
            className={styles.track}
            role="progressbar"
            aria-valuenow={Math.round(speech.progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Avanzamento dell'audioguida"
          >
            <div className={styles.fill} style={{ width: `${speech.progress * 100}%` }} />
          </div>
          <div className={styles.times}>
            <span className={styles.time}>{formatClock(speech.elapsed)}</span>
            <span className={styles.time}>{formatClock(speech.duration)}</span>
          </div>
        </div>

        <button
          type="button"
          className={[styles.mini, styles.rate].join(" ")}
          onClick={cycleRate}
          aria-label={`Velocità di lettura ${rate}×`}
        >
          {rate}×
        </button>
      </div>

      {speech.simulated && (
        <p className={styles.note}>
          Questo browser non supporta la sintesi vocale: la barra mostra il tempo di
          lettura stimato, il testo resta disponibile qui sotto.
        </p>
      )}
    </div>
  );
});

export default AudioPlayer;
