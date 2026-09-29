import { useMemo } from "react";
import MuseumMap from "@/components/map/MuseumMap";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import VoiceButton from "@/components/voice/VoiceButton";
import { ScreenHeader } from "@/components/layout/Screen";
import { useTour } from "@/context/TourContext";
import { entryPoint, findPath, pathMeters } from "@/lib/museumMap";
import { formatMeters } from "@/lib/format";
import styles from "./TourScreen.module.css";

/**
 * Avvicinamento all'opera: mostra dove si trova e come raggiungerla,
 * poi attende la conferma del visitatore.
 *
 * La conferma non è una formalità: senza posizionamento indoor è l'unico
 * momento in cui l'app sa davvero dove si trova chi la sta usando, e da
 * lì ricalcola tutte le distanze successive.
 */
export default function ArrivalPanel({ onVoice }) {
  const tour = useTour();
  const { placement, currentItem, position } = tour;

  const floor = placement?.floor || null;
  const target = useMemo(
    () => (placement ? { x: placement.x, y: placement.y } : null),
    [placement],
  );

  // Se il visitatore è su un altro piano, il percorso parte dall'ingresso
  // del piano di destinazione: le scale non sono modellate nella mappa.
  const sameFloor = position && placement && position.floorOrder === placement.floorOrder;
  const from = useMemo(() => {
    if (!floor) return null;
    return sameFloor ? { x: position.x, y: position.y } : entryPoint(floor);
  }, [floor, sameFloor, position]);

  const path = useMemo(
    () => (floor && from && target ? findPath(floor, from, target) : []),
    [floor, from, target],
  );

  const meters = pathMeters(path);

  return (
    <div className={styles.arrival}>
      <ScreenHeader
        eyebrow={tour.visitTitle}
        title="Raggiungi l'opera"
        subtitle={`Tappa ${tour.stopIndex + 1} di ${tour.totalStops}`}
        actions={onVoice ? <VoiceButton onClick={onVoice} /> : null}
      />

      {!sameFloor && placement && (
        <div className={styles.floorWarning}>
          <span>
            <strong>{currentItem.title}</strong> si trova al{" "}
            <strong>{placement.floorName}</strong>
          </span>
        </div>
      )}

      <MuseumMap floor={floor} userPosition={from} target={target} path={path} />

      <div className={styles.arrivalFooter}>
        <div className={styles.arrivalHint}>
          {path.length > 1 ? (
            <>
              Segui il percorso dorato per {formatMeters(meters)} fino a{" "}
              <span className={styles.arrivalTarget}>{currentItem.title}</span>
            </>
          ) : (
            <>
              Raggiungi <span className={styles.arrivalTarget}>{currentItem.title}</span> —{" "}
              {placement?.floorName}
            </>
          )}
        </div>
        <Button variant="primary" block onClick={tour.markArrived}>
          <Icon name="check" size={18} color="var(--onGold)" /> Sono arrivato
        </Button>
      </div>
    </div>
  );
}
