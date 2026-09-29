import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Screen, { ScreenBody, ScreenHeader } from "@/components/layout/Screen";
import Icon from "@/components/ui/Icon";
import ArtImage from "@/components/ui/ArtImage";
import { EmptyState } from "@/components/ui/StateView";
import { useMuseum } from "@/context/MuseumContext";
import { plural } from "@/lib/format";
import { ROUTES } from "@/constants/config";
import styles from "./ArtworksScreen.module.css";

/** Catalogo delle opere del museo, sfogliabile anche senza una visita attiva. */
export default function ArtworksScreen() {
  const navigate = useNavigate();
  const { slug, items, getPlacement } = useMuseum();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState(null);

  // I tag più usati diventano filtri rapidi; oltre otto la barra
  // diventerebbe più lunga del catalogo stesso.
  const topTags = useMemo(() => {
    const counts = new Map();
    for (const item of items) {
      for (const t of item.tags || []) counts.set(t, (counts.get(t) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([t]) => t);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (tag && !(item.tags || []).includes(tag)) return false;
      if (!q) return true;
      return [item.title, item.artist, item.period, ...(item.tags || [])].some((field) =>
        String(field || "").toLowerCase().includes(q),
      );
    });
  }, [items, query, tag]);

  return (
    <Screen layout="wide">
      {/* Il ritorno alla scheda del museo è l'unica via d'uscita su mobile,
          dove la barra in basso offre solo le tre sezioni. */}
      <ScreenHeader
        plain
        eyebrow="Collezione"
        title="Le opere"
        subtitle="Sfoglia liberamente, senza seguire un percorso"
        onBack={() => navigate(ROUTES.museum(slug))}
      />

      <ScreenBody>
        {items.length === 0 ? (
          <EmptyState
            icon="grid"
            title="Nessuna opera pubblicata"
            message="Questo museo non ha ancora opere disponibili nell'app."
          />
        ) : (
          <>
            <div className={styles.search}>
              <Icon name="search" size={18} color="var(--textMuted)" />
              <input
                className={styles.searchInput}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cerca per titolo o autore"
                aria-label="Cerca un'opera"
              />
            </div>

            {topTags.length > 1 && (
              <div className={styles.tags}>
                {topTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={[styles.tag, tag === t && styles.tagActive]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setTag(tag === t ? null : t)}
                    aria-pressed={tag === t}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            <div className={styles.count}>
              {plural(filtered.length, "opera", "opere")}
              {tag ? ` · ${tag}` : ""}
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon="search"
                title="Nessun risultato"
                message="Prova con un altro titolo, autore o tag."
              />
            ) : (
              <div className={styles.grid}>
                {filtered.map((item) => {
                  const placement = getPlacement(item._id);
                  return (
                    <Link
                      key={item._id}
                      to={ROUTES.artwork(slug, item._id)}
                      className={styles.card}
                    >
                      <ArtImage
                        src={item.imageUrl}
                        seed={item._id}
                        alt={item.title}
                        height={110}
                        radius={0}
                      />
                      <div className={styles.cardBody}>
                        <div className={styles.cardTitle}>{item.title}</div>
                        <div className={styles.cardAuthor}>{item.artist}</div>
                        <div className={styles.cardMeta}>
                          {placement ? placement.floorName : item.period}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </ScreenBody>
    </Screen>
  );
}
