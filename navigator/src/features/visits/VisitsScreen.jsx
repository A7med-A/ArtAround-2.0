import { useNavigate } from "react-router-dom";
import Screen, { ScreenBody, ScreenHeader } from "@/components/layout/Screen";
import Icon from "@/components/ui/Icon";
import Pill from "@/components/ui/Pill";
import ArtImage from "@/components/ui/ArtImage";
import { EmptyState } from "@/components/ui/StateView";
import { useMuseum } from "@/context/MuseumContext";
import { useTour } from "@/context/TourContext";
import { estimateVisitMinutes, toneRange } from "@/lib/content";
import { TONE_SHORT } from "@/constants/schema";
import { plural } from "@/lib/format";
import { ROUTES } from "@/constants/config";
import styles from "./VisitsScreen.module.css";

/**
 * Scelta del percorso.
 *
 * Il modello Visit del server contiene solo titolo, descrizione e la
 * sequenza di opere: durata e livello mostrati qui sono ricavati dai
 * testi delle opere che compongono il percorso.
 */
export default function VisitsScreen() {
  const navigate = useNavigate();
  const { slug, museum, visits, items } = useMuseum();
  const tour = useTour();

  const startGuided = (visit) => {
    tour.startGuided(visit);
    navigate(ROUTES.tour(slug));
  };

  const startFree = () => {
    tour.startFree();
    navigate(ROUTES.tour(slug));
  };

  return (
    <Screen layout="wide">
      <ScreenHeader
        eyebrow={museum.name}
        title="Scegli la visita"
        onBack={() => navigate(ROUTES.museum(slug))}
      />

      <ScreenBody>
        {visits.length === 0 ? (
          <EmptyState
            icon="route"
            title="Nessun percorso guidato"
            message="Questo museo non ha ancora visite guidate pubblicate. Puoi comunque ascoltare le opere in ordine libero."
          />
        ) : (
          <div className={styles.list}>
            {visits.map((visit) => {
              const stops = visit.items?.length || 0;
              const minutes = estimateVisitMinutes(visit.items, tour.prefs);
              const tones = toneRange(visit.items);
              return (
                <button
                  key={visit._id}
                  type="button"
                  className={styles.card}
                  onClick={() => startGuided(visit)}
                >
                  <div className={styles.thumb}>
                    <ArtImage
                      src={visit.items?.[0]?.imageUrl}
                      seed={visit._id}
                      alt=""
                      height={158}
                      radius={0}
                    />
                  </div>
                  <div className={styles.body}>
                    <div className={styles.title}>{visit.title}</div>
                    <div className={styles.desc}>{visit.description}</div>
                    <div className={styles.meta}>
                      <Pill icon="clock">{minutes} min</Pill>
                      <Pill icon="grid">{plural(stops, "opera", "opere")}</Pill>
                      {tones.length > 0 && (
                        <Pill
                          icon="layers"
                          title={`Livelli disponibili: ${tones
                            .map((t) => TONE_SHORT[t])
                            .join(", ")}`}
                        >
                          {tones.length === 1
                            ? TONE_SHORT[tones[0]]
                            : `${tones.length} livelli`}
                        </Pill>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {items.length > 0 && (
          <button type="button" className={styles.free} onClick={startFree}>
            <span className={styles.freeIcon}>
              <Icon name="headphones" size={20} color="var(--gold)" />
            </span>
            <span>
              <span className={styles.freeTitle}>Ascolto libero</span>
              <span className={styles.freeSub}>
                Tutte le {items.length} opere del museo, senza un ordine obbligato.
                Scegli tu da dove partire.
              </span>
            </span>
          </button>
        )}
      </ScreenBody>
    </Screen>
  );
}
