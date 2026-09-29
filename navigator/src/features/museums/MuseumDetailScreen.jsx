import { useNavigate } from "react-router-dom";
import Screen, { ScreenBody, ScreenFooter } from "@/components/layout/Screen";
import Icon from "@/components/ui/Icon";
import Pill from "@/components/ui/Pill";
import Button from "@/components/ui/Button";
import ArtImage from "@/components/ui/ArtImage";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AccountMenu from "@/components/account/AccountMenu";
import { useMuseum } from "@/context/MuseumContext";
import { useTour } from "@/context/TourContext";
import { useAuth } from "@/context/AuthContext";
import { plural } from "@/lib/format";
import { estimateVisitMinutes } from "@/lib/content";
import { ROUTES } from "@/constants/config";
import styles from "./MuseumDetailScreen.module.css";

/** Scheda del museo: presentazione e punti d'ingresso alla visita. */
export default function MuseumDetailScreen() {
  const navigate = useNavigate();
  const { museum, items, visits, floors, slug } = useMuseum();
  const tour = useTour();
  const { user } = useAuth();

  // Chi può condurre una visita guidata: i docenti sulle proprie visite,
  // gli amministratori e gli autori del museo. Stessa condizione che il
  // server verifica all'apertura della sessione.
  const canLead =
    user?.role === "admin" ||
    user?.role === "docente" ||
    (user?.role === "author" && (user.museumSlugs || []).includes(slug));

  const averageMinutes = visits.length
    ? Math.round(
        visits.reduce((sum, v) => sum + estimateVisitMinutes(v.items, tour.prefs), 0) /
          visits.length,
      )
    : estimateVisitMinutes(items, tour.prefs);

  return (
    <Screen className={styles.screen}>
      <div className={styles.hero}>
        <ArtImage
          src={museum.coverImageUrl}
          seed={museum.slug}
          alt={museum.name}
          height="var(--art-height)"
          radius={0}
        />
        <button
          type="button"
          className={styles.heroBack}
          onClick={() => navigate(ROUTES.MUSEUMS)}
          aria-label="Torna all'elenco dei musei"
        >
          <Icon name="chevL" size={20} color="#fff" />
        </button>
        <div className={styles.heroActions}>
          <AccountMenu />
          <ThemeToggle />
        </div>
        <div className={styles.heroFade} />
      </div>

      <div className={styles.column}>
      <ScreenBody padded={false}>
        <div className={styles.content}>
          {museum.address && <div className={styles.city}>{museum.address}</div>}
          <h1 className={styles.name}>{museum.name}</h1>

          <div className={styles.meta}>
            <Pill icon="layers">{plural(floors.length, "piano", "piani")}</Pill>
            <Pill icon="grid">{plural(items.length, "opera", "opere")}</Pill>
            {visits.length > 0 && (
              <Pill icon="route">{plural(visits.length, "percorso", "percorsi")}</Pill>
            )}
          </div>

          {museum.description && <p className={styles.description}>{museum.description}</p>}

          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{visits.length}</div>
              <div className={styles.statLabel}>Visite guidate</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{items.length}</div>
              <div className={styles.statLabel}>Opere raccontate</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{averageMinutes}′</div>
              <div className={styles.statLabel}>Durata media</div>
            </div>
          </div>
        </div>
      </ScreenBody>

      <ScreenFooter>
        {tour.isActive && (
          <div className={styles.resume}>
            <Icon name="headphones" size={18} color="var(--gold)" />
            <div className={styles.resumeText}>
              <span className={styles.resumeTitle}>{tour.visitTitle}</span> — tappa{" "}
              {tour.stopIndex + 1} di {tour.totalStops}
            </div>
            <Button size="sm" variant="primary" onClick={() => navigate(ROUTES.tour(slug))}>
              Riprendi
            </Button>
          </div>
        )}

        <Button
          variant="primary"
          block
          iconRight="arrowR"
          disabled={visits.length === 0}
          onClick={() => navigate(ROUTES.visits(slug))}
        >
          {visits.length === 0 ? "Nessuna visita guidata" : "Inizia visita guidata"}
        </Button>

        {canLead && (
          <Button
            variant="secondary"
            block
            icon="user"
            onClick={() => navigate(ROUTES.sessions(slug))}
          >
            Conduci una visita con la classe
          </Button>
        )}

        <div className={styles.secondary}>
          <Button size="sm" variant="secondary" icon="map" onClick={() => navigate(ROUTES.map(slug))}>
            Esplora mappa
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon="grid"
            onClick={() => navigate(ROUTES.artworks(slug))}
          >
            Sfoglia opere
          </Button>
        </div>
      </ScreenFooter>
      </div>
    </Screen>
  );
}
