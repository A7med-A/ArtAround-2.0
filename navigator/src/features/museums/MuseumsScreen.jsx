import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Screen, { ScreenBody, ScreenHeader } from "@/components/layout/Screen";
import Icon from "@/components/ui/Icon";
import Pill from "@/components/ui/Pill";
import ArtImage from "@/components/ui/ArtImage";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AccountMenu from "@/components/account/AccountMenu";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateView";
import useAsync from "@/hooks/useAsync";
import { museumsApi } from "@/api";
import { countPlacedItems } from "@/lib/museumMap";
import { plural, truncate } from "@/lib/format";
import { ROUTES } from "@/constants/config";
import styles from "./MuseumsScreen.module.css";

/** Elenco dei musei disponibili. È la schermata da cui inizia ogni visita. */
export default function MuseumsScreen() {
  const { data, loading, error, reload } = useAsync(() => museumsApi.fetchMuseums(), []);
  const [query, setQuery] = useState("");

  const museums = useMemo(() => {
    const list = data || [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((m) =>
      [m.name, m.address, m.description].some((field) =>
        String(field || "").toLowerCase().includes(q),
      ),
    );
  }, [data, query]);

  return (
    <Screen layout="wide">
      <ScreenHeader
        plain
        eyebrow="ArtAround Navigator"
        title="Scegli il museo"
        subtitle="Seleziona dove ti trovi oggi"
        actions={
          <div className={styles.headerActions}>
            <AccountMenu />
            <ThemeToggle />
          </div>
        }
      />

      <ScreenBody>
        {loading ? (
          <LoadingState message="Carico i musei…" />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (data || []).length === 0 ? (
          <EmptyState
            icon="layers"
            title="Nessun museo disponibile"
            message="Non ci sono ancora musei pubblicati. Riprova più tardi."
          />
        ) : (
          <>
            {(data || []).length > 4 && (
              <div className={styles.search}>
                <Icon name="search" size={18} color="var(--textMuted)" />
                <input
                  className={styles.searchInput}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cerca per nome o città"
                  aria-label="Cerca un museo"
                />
              </div>
            )}

            <div className={styles.list}>
              {museums.map((museum) => {
                const artworks = countPlacedItems(museum);
                return (
                  <Link
                    key={museum.slug}
                    to={ROUTES.museum(museum.slug)}
                    className={styles.card}
                  >
                    <ArtImage
                      src={museum.coverImageUrl}
                      seed={museum.slug}
                      alt={museum.name}
                      height={120}
                      radius={0}
                    />
                    <div className={styles.cardBody}>
                      <div className={styles.cardHead}>
                        <span className={styles.name}>{museum.name}</span>
                      </div>
                      {museum.description && (
                        <p className={styles.desc}>{truncate(museum.description, 130)}</p>
                      )}
                      <div className={styles.meta}>
                        {museum.address && (
                          <Pill icon="location">{truncate(museum.address, 28)}</Pill>
                        )}
                        <Pill icon="layers">
                          {plural(museum.floors?.length || 0, "piano", "piani")}
                        </Pill>
                        {artworks > 0 && (
                          <Pill icon="grid">{plural(artworks, "opera", "opere")}</Pill>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}

              {museums.length === 0 && (
                <p className={styles.noResults}>Nessun museo corrisponde alla ricerca.</p>
              )}

              {/* Chi partecipa a una visita guidata non deve cercare il museo:
                  la sessione sa già dove si svolge. */}
              <Link to={ROUTES.JOIN} className={[styles.hintCard, styles.hintAction].join(" ")}>
                <span className={styles.hintIcon}>
                  <Icon name="headphones" size={18} color="var(--gold)" />
                </span>
                <div>
                  <div className={styles.hintTitle}>Sei in gita con la classe?</div>
                  <div className={styles.hintSub}>
                    Entra digitando il codice che ti ha dettato il tuo insegnante
                  </div>
                </div>
                <Icon name="chevR" size={18} color="var(--textMuted)" />
              </Link>
            </div>
          </>
        )}
      </ScreenBody>
    </Screen>
  );
}
