import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Screen, { ScreenHeader } from "@/components/layout/Screen";
import Icon from "@/components/ui/Icon";
import IconButton from "@/components/ui/IconButton";
import Sheet from "@/components/ui/Sheet";
import { EmptyState } from "@/components/ui/StateView";
import MuseumMap from "@/components/map/MuseumMap";
import FloorTabs from "@/components/map/FloorTabs";
import MapLegend from "@/components/map/MapLegend";
import VoiceButton from "@/components/voice/VoiceButton";
import VoiceOverlay from "@/components/voice/VoiceOverlay";
import { useMuseum } from "@/context/MuseumContext";
import { useTour } from "@/context/TourContext";
import useTourCommands from "@/features/tour/useTourCommands";
import { entryPoint, findPath, findService, listServices } from "@/lib/museumMap";
import { CELL_COLORS, CELL_ICONS, CELL_LABELS } from "@/constants/schema";
import { formatMeters, plural } from "@/lib/format";
import { VOICE_COMMANDS } from "@/constants/voiceCommands";
import { ROUTES } from "@/constants/config";
import styles from "./MapScreen.module.css";

/**
 * Pianta del museo.
 *
 * Mostra dove si trova il visitatore, dove si trova la prossima opera della
 * visita e come raggiungere i servizi. Il parametro `?servizio=bagno` — usato
 * dai comandi vocali — apre direttamente il percorso verso quel servizio.
 */
export default function MapScreen() {
  const navigate = useNavigate();
  const { slug, museum, floors, getPlacement } = useMuseum();
  const tour = useTour();
  const { runCommand, isDisabled } = useTourCommands(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedService = searchParams.get("servizio");
  const startFloor = tour.placement?.floorOrder ?? tour.position?.floorOrder ?? floors[0]?.order ?? 0;

  const [floorOrder, setFloorOrder] = useState(startFloor);
  const [showLegend, setShowLegend] = useState(true);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [service, setService] = useState(requestedService);

  const floor = useMemo(
    () => floors.find((f) => f.order === floorOrder) || floors[0] || null,
    [floors, floorOrder],
  );

  // Un comando vocale può chiedere un servizio mentre la mappa è già aperta.
  useEffect(() => {
    if (requestedService) {
      setService(requestedService);
      setServicesOpen(false);
    }
  }, [requestedService]);

  // Posizione del visitatore: quella nota se è su questo piano,
  // altrimenti l'ingresso del piano che sta guardando.
  const userPosition = useMemo(() => {
    if (!floor) return null;
    if (tour.position && tour.position.floorOrder === floor.order) {
      return { x: tour.position.x, y: tour.position.y };
    }
    return entryPoint(floor);
  }, [floor, tour.position]);

  // Il piano da cui si parte per cercare i servizi è quello in cui si trova
  // davvero il visitatore, non quello che sta sfogliando sulla mappa.
  const standingFloor = useMemo(
    () => floors.find((f) => f.order === tour.position?.floorOrder) || floors[0] || null,
    [floors, tour.position],
  );
  const standingPoint = useMemo(
    () =>
      tour.position && standingFloor?.order === tour.position.floorOrder
        ? { x: tour.position.x, y: tour.position.y }
        : entryPoint(standingFloor),
    [standingFloor, tour.position],
  );

  const artworkPlacement = tour.currentItem ? getPlacement(tour.currentItem._id) : null;
  const artworkOnThisFloor = artworkPlacement && artworkPlacement.floorOrder === floor?.order;

  // Destinazione: il servizio cercato ha la precedenza sull'opera corrente,
  // perché è una richiesta esplicita e immediata del visitatore.
  const serviceRoute = useMemo(
    () => (service ? findService(museum, standingFloor, standingPoint, service) : null),
    [museum, standingFloor, standingPoint, service],
  );

  // Se il servizio è su un altro piano, la mappa ci si sposta da sola:
  // mostrare la pianta sbagliata sarebbe inutile.
  useEffect(() => {
    if (serviceRoute && serviceRoute.floor.order !== floorOrder) {
      setFloorOrder(serviceRoute.floor.order);
    }
  }, [serviceRoute, floorOrder]);

  const serviceOnThisFloor = serviceRoute && serviceRoute.floor.order === floor?.order;

  const target = useMemo(() => {
    if (serviceOnThisFloor) return { x: serviceRoute.cell.x, y: serviceRoute.cell.y };
    if (artworkOnThisFloor) return { x: artworkPlacement.x, y: artworkPlacement.y };
    return null;
  }, [serviceOnThisFloor, serviceRoute, artworkOnThisFloor, artworkPlacement]);

  const path = useMemo(() => {
    if (serviceOnThisFloor) return serviceRoute.path;
    if (!floor || !target || !userPosition) return [];
    return findPath(floor, userPosition, target);
  }, [serviceOnThisFloor, serviceRoute, floor, target, userPosition]);

  const services = useMemo(
    () => (standingFloor ? listServices(museum, standingFloor, standingPoint) : []),
    [museum, standingFloor, standingPoint],
  );

  const clearService = () => {
    setService(null);
    if (searchParams.has("servizio")) {
      searchParams.delete("servizio");
      setSearchParams(searchParams, { replace: true });
    }
  };

  const chooseService = (type) => {
    setService(type);
    setServicesOpen(false);
  };

  const disabledActions = useMemo(
    () => VOICE_COMMANDS.map((c) => c.action).filter(isDisabled),
    [isDisabled],
  );

  if (floors.length === 0) {
    return (
      <EmptyState
        icon="map"
        title="Mappa non disponibile"
        message={`${museum.name} non ha ancora pubblicato la pianta dei suoi spazi.`}
      />
    );
  }

  const subtitle = serviceRoute
    ? serviceRoute.sameFloor
      ? `${CELL_LABELS[service]} a ${formatMeters(serviceRoute.meters)}`
      : `${CELL_LABELS[service]} — ${serviceRoute.floor.name}`
    : artworkOnThisFloor
      ? `Prossima opera: ${tour.currentItem.title}`
      : floor?.name;

  return (
    <Screen layout="full">
      <ScreenHeader
        plain
        title="Mappa del museo"
        subtitle={subtitle}
        onBack={() => navigate(ROUTES.museum(slug))}
        actions={
          <div className={styles.headerActions}>
            <IconButton
              icon="search"
              size={40}
              iconSize={18}
              active={servicesOpen}
              onClick={() => setServicesOpen(true)}
              label="Cerca un servizio"
            />
            <IconButton
              icon="list"
              size={40}
              iconSize={18}
              active={showLegend}
              onClick={() => setShowLegend((s) => !s)}
              label="Mostra o nascondi la legenda"
            />
            <VoiceButton onClick={() => setVoiceOpen(true)} />
          </div>
        }
      />

      <FloorTabs floors={floors} activeOrder={floor?.order} onChange={setFloorOrder} />

      {serviceRoute && (
        <div className={styles.banner}>
          <span>
            {serviceRoute.sameFloor ? (
              <>
                <strong>{CELL_LABELS[service]}</strong> a {formatMeters(serviceRoute.meters)} da te
                — segui il percorso dorato
              </>
            ) : (
              <>
                <strong>{CELL_LABELS[service]}</strong> si trova al{" "}
                {serviceRoute.floor.name}: il percorso parte dall'ingresso del piano
              </>
            )}
          </span>
          <button type="button" className={styles.bannerBtn} onClick={clearService}>
            Chiudi
          </button>
        </div>
      )}

      {!serviceRoute && artworkPlacement && !artworkOnThisFloor && (
        <div className={styles.banner}>
          <span>
            <strong>{tour.currentItem.title}</strong> si trova al{" "}
            {artworkPlacement.floorName}
          </span>
          <button
            type="button"
            className={styles.bannerBtn}
            onClick={() => setFloorOrder(artworkPlacement.floorOrder)}
          >
            Vai
          </button>
        </div>
      )}

      <MuseumMap
        floor={floor}
        userPosition={userPosition}
        target={target}
        path={path}
        highlightType={service}
      />

      {showLegend && <MapLegend floor={floor} />}

      {servicesOpen && (
        <Sheet onClose={() => setServicesOpen(false)} label="Servizi del museo">
          <div className={styles.sheetTitle}>Servizi</div>
          <div className={styles.sheetSub}>
            {services.length > 0
              ? `${plural(services.length, "servizio raggiungibile", "servizi raggiungibili")} da dove ti trovi`
              : "Nessun servizio segnalato in questo museo"}
          </div>

          {services.length === 0 ? (
            <div className={styles.emptyServices}>
              La pianta di questo museo non riporta toilette, bar o uscite.
            </div>
          ) : (
            <div className={styles.services}>
              {services.map((entry) => {
                const color = CELL_COLORS[entry.type];
                return (
                  <button
                    key={entry.type}
                    type="button"
                    className={[styles.service, service === entry.type && styles.serviceActive]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => chooseService(entry.type)}
                  >
                    <span
                      className={styles.serviceIcon}
                      style={{
                        background: `color-mix(in srgb, ${color} 14%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
                      }}
                    >
                      <Icon name={CELL_ICONS[entry.type]} size={20} color={color} />
                    </span>
                    <span className={styles.serviceBody}>
                      <span className={styles.serviceName}>{CELL_LABELS[entry.type]}</span>
                      <span className={styles.serviceMeta}>
                        {entry.sameFloor
                          ? `${formatMeters(entry.meters)} da te`
                          : entry.floor.name}
                        {entry.count > 1 ? ` · ${entry.count} punti` : ""}
                      </span>
                    </span>
                    <Icon name="route" size={18} color="var(--gold)" />
                  </button>
                );
              })}
            </div>
          )}
        </Sheet>
      )}

      {voiceOpen && (
        <VoiceOverlay
          onClose={() => setVoiceOpen(false)}
          onCommand={(action) => {
            const serviceType = { toilet: "bagno", exit: "uscita", bar: "bar" }[action];
            if (serviceType) chooseService(serviceType);
            else runCommand(action);
          }}
          disabledActions={disabledActions}
        />
      )}
    </Screen>
  );
}
