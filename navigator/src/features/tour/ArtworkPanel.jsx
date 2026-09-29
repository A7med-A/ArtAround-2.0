import Icon from "@/components/ui/Icon";
import Pill from "@/components/ui/Pill";
import ArtImage from "@/components/ui/ArtImage";
import AudioPlayer from "@/components/audio/AudioPlayer";
import { availableDurations, availableTones } from "@/lib/content";
import { DURATION_LABELS, TONE_LABELS, LICENSE_LABELS } from "@/constants/schema";
import { formatDuration } from "@/lib/format";
import styles from "./TourScreen.module.css";

/**
 * Contenuto dell'opera raggiunta: immagine, dati, audioguida e testo.
 *
 * Componente puramente presentazionale: riceve tutto per props. Lo usano
 * sia la visita libera (stato da TourContext) sia la visita guidata dalla
 * docente (stato dalla sessione live), che differiscono solo per chi decide
 * la tappa — il modo di raccontare l'opera è lo stesso.
 *
 * Il selettore "Livello" corrisponde a `Item.texts[].tone` e il selettore
 * "Lunghezza" a `Item.texts[].duration`: entrambi mostrano solo le varianti
 * che l'autore ha effettivamente scritto per quest'opera.
 *
 * I blocchi sono cinque e restano nell'ordine di lettura mobile; su desktop
 * una griglia ad aree li ridispone su due colonne — immagine e comandi a
 * sinistra, testo a destra — senza toccare l'ordine nel DOM.
 */
export default function ArtworkPanel({
  item,
  content,
  prefs,
  placement,
  playerRef,
  onTone,
  onDuration,
  onRate,
  onOpenDetail,
}) {
  const tones = availableTones(item);
  const durations = availableDurations(item, content?.tone);

  return (
    <div className={styles.panel}>
      <div className={styles.panelHero}>
        <ArtImage src={item.imageUrl} seed={item._id} alt={item.title} height={190} />
        {/* Nella visita guidata la scheda completa non è raggiungibile: le
            opere private del docente non stanno nel catalogo del museo. */}
        {onOpenDetail && (
          <button type="button" className={styles.detailBtn} onClick={onOpenDetail}>
            <Icon name="info" size={14} color="#fff" />
            Dettaglio
          </button>
        )}
      </div>

      <div className={styles.panelHead}>
        <h1 className={styles.title}>{item.title}</h1>
        <div className={styles.author}>
          {item.artist}
          {item.period ? ` · ${item.period}` : ""}
        </div>
        <div className={styles.meta}>
          {placement && <Pill icon="location">{placement.floorName}</Pill>}
          {content && <Pill icon="clock">{formatDuration(content.seconds)} di ascolto</Pill>}
          {item.license && (
            <Pill icon="info">{LICENSE_LABELS[item.license] || item.license}</Pill>
          )}
        </div>
      </div>

      <div className={styles.panelPlayer}>
        <AudioPlayer
          ref={playerRef}
          text={content?.text}
          rate={prefs.rate}
          onRateChange={onRate}
        />
      </div>

      <div className={styles.panelLevels}>
        {tones.length > 1 && (
          <>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionLabelText}>Livello</span>
              <span className={styles.rule} />
            </div>
            <div className={styles.levels}>
              {tones.map((tone) => {
                const active = content?.tone === tone;
                return (
                  <button
                    key={tone}
                    type="button"
                    className={[styles.level, active && styles.levelActive]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => onTone(tone)}
                    aria-pressed={active}
                  >
                    {TONE_LABELS[tone]}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {durations.length > 1 && (
          <div className={styles.lengths}>
            {durations.map((duration) => {
              const active = content?.duration === duration;
              return (
                <button
                  key={duration}
                  type="button"
                  className={[styles.length, active && styles.lengthActive]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => onDuration(duration)}
                  aria-pressed={active}
                >
                  {DURATION_LABELS[duration]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.panelText}>
        <div className={styles.textCard}>
          {content ? (
            <p className={styles.text}>{content.text}</p>
          ) : (
            <p className={styles.text}>
              {item.description || "Per quest'opera non è ancora disponibile un racconto."}
            </p>
          )}

          {content && !content.exact && (
            <p className={styles.fallbackNote}>
              Per quest'opera non esiste la variante «{TONE_LABELS[prefs.tone]} ·{" "}
              {DURATION_LABELS[prefs.duration]}». Stai ascoltando «{TONE_LABELS[content.tone]} ·{" "}
              {DURATION_LABELS[content.duration]}», la più vicina fra quelle scritte.
            </p>
          )}

          {item.tags?.length > 0 && (
            <div className={styles.tags}>
              {item.tags.map((tag) => (
                <Pill key={tag} icon="tag">
                  {tag}
                </Pill>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
