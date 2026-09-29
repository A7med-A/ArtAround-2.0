import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Screen, { ScreenBody } from "@/components/layout/Screen";
import Icon from "@/components/ui/Icon";
import Pill from "@/components/ui/Pill";
import ArtImage from "@/components/ui/ArtImage";
import { ErrorState } from "@/components/ui/StateView";
import { useMuseum } from "@/context/MuseumContext";
import { useTour } from "@/context/TourContext";
import { availableDurations, availableTones, estimateSeconds } from "@/lib/content";
import { DURATION_LABELS, LICENSE_LABELS, TONE_COLORS, TONE_LABELS } from "@/constants/schema";
import { formatDuration } from "@/lib/format";
import { ROUTES } from "@/constants/config";
import styles from "./ArtworkDetailScreen.module.css";

/**
 * Scheda completa dell'opera.
 *
 * Mostra tutti i livelli di racconto scritti dall'autore nel Marketplace:
 * un pannello per ogni `tone`, con le lunghezze (`duration`) disponibili.
 * Da qui si può far partire l'ascolto a un livello specifico.
 */
export default function ArtworkDetailScreen() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { slug, getItem, getPlacement } = useMuseum();
  const tour = useTour();

  const item = getItem(itemId);
  const placement = getPlacement(itemId);

  const tones = useMemo(() => (item ? availableTones(item) : []), [item]);
  const [openTone, setOpenTone] = useState(null);
  const [variant, setVariant] = useState({});

  if (!item) {
    return (
      <ErrorState
        title="Opera non trovata"
        message="Questa opera non fa parte del museo selezionato."
        onRetry={() => navigate(ROUTES.artworks(slug), { replace: true })}
      />
    );
  }

  // Il primo pannello aperto è quello del livello preferito, se esiste.
  const activeTone = openTone !== null ? openTone : tones.includes(tour.prefs.tone) ? tour.prefs.tone : tones[0];

  const listen = (tone, duration) => {
    tour.setTone(tone);
    tour.setDuration(duration);
    // L'ascolto libero parte proprio da quest'opera; se una visita guidata
    // è già in corso e la contiene, salta invece alla sua tappa.
    if (tour.isActive && tour.stops.some((s) => String(s._id) === String(item._id))) {
      tour.goToItem(item._id, { arrived: true });
    } else {
      tour.startFree(item._id);
    }
    navigate(ROUTES.tour(slug));
  };

  const metadata = [
    ["Artista", item.artist],
    ["Periodo", item.period],
    placement && ["Posizione", placement.floorName],
    item.license && ["Licenza", LICENSE_LABELS[item.license] || item.license],
  ].filter(Boolean);

  return (
    <Screen className={styles.screen}>
      <div className={styles.hero}>
        <ArtImage
          src={item.imageUrl}
          seed={item._id}
          alt={item.title}
          height="var(--art-height)"
          radius={0}
        />
        <button type="button" className={styles.back} onClick={() => navigate(-1)} aria-label="Indietro">
          <Icon name="chevL" size={20} color="#fff" />
        </button>
        <div className={styles.fade} />
      </div>

      <ScreenBody padded={false}>
        <div className={styles.content}>
          <h1 className={styles.title}>{item.title}</h1>
          <div className={styles.author}>
            {item.artist}
            {item.period ? ` · ${item.period}` : ""}
          </div>

          <div className={styles.metaGrid}>
            {metadata.map(([key, value]) => (
              <div key={key} className={styles.metaCard}>
                <div className={styles.metaKey}>{key}</div>
                <div className={styles.metaValue}>{value}</div>
              </div>
            ))}
          </div>

          {item.description && <p className={styles.description}>{item.description}</p>}

          <div className={styles.sectionTitle}>
            <Icon name="layers" size={16} color="var(--gold)" />
            <span className={styles.sectionTitleText}>Livelli di approfondimento</span>
          </div>

          {tones.length === 0 ? (
            <div className={styles.noContent}>
              Per quest'opera non sono ancora stati pubblicati testi di
              approfondimento. Resta disponibile la descrizione qui sopra.
            </div>
          ) : (
            <div className={styles.levels}>
              {tones.map((tone) => {
                const open = activeTone === tone;
                const durations = availableDurations(item, tone);
                const selected = variant[tone] || durations[0];
                const text = item.texts.find(
                  (t) => t.tone === tone && t.duration === selected,
                )?.text;

                return (
                  <div
                    key={tone}
                    className={[styles.level, open && styles.levelOpen].filter(Boolean).join(" ")}
                  >
                    <button
                      type="button"
                      className={styles.levelHead}
                      onClick={() => setOpenTone(open ? "" : tone)}
                      aria-expanded={open}
                    >
                      <span className={styles.dot} style={{ background: TONE_COLORS[tone] }} />
                      <span className={styles.levelName}>{TONE_LABELS[tone]}</span>
                      <Pill icon="clock">{formatDuration(estimateSeconds(text, selected))}</Pill>
                      <Icon name={open ? "chevUp" : "chevDown"} size={16} color="var(--textSec)" />
                    </button>

                    {open && (
                      <div className={styles.levelBody}>
                        {durations.length > 1 && (
                          <div className={styles.variantTabs}>
                            {durations.map((duration) => (
                              <button
                                key={duration}
                                type="button"
                                className={[
                                  styles.variantTab,
                                  selected === duration && styles.variantActive,
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                                onClick={() => setVariant((v) => ({ ...v, [tone]: duration }))}
                              >
                                {DURATION_LABELS[duration]}
                              </button>
                            ))}
                          </div>
                        )}

                        <p className={styles.levelText}>{text}</p>

                        <button
                          type="button"
                          className={styles.listen}
                          onClick={() => listen(tone, selected)}
                        >
                          <Icon name="headphones" size={15} color="var(--gold)" />
                          Ascolta questo livello
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScreenBody>
    </Screen>
  );
}
