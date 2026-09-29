import { useEffect, useState } from "react";
import { hashSeed } from "@/lib/format";
import styles from "./ArtImage.module.css";

/**
 * Immagine di un'opera o di un museo.
 *
 * `Item.imageUrl` è facoltativo nel modello del server e spesso vuoto: in quel
 * caso — o se l'URL non risolve — mostriamo un motivo astratto deterministico
 * derivato dall'identificativo, così la stessa opera ha sempre lo stesso aspetto
 * e le liste restano leggibili invece di riempirsi di riquadri rotti.
 *
 * `height` accetta un numero di pixel o una qualsiasi lunghezza CSS: le
 * schermate che cambiano impaginazione su desktop passano una custom property
 * (es. `var(--art-height, 250px)`) e la ridefiniscono da CSS nella media query,
 * senza dover duplicare il componente né misurare la finestra in JavaScript.
 */

const PALETTES = [
  ["#3a3654", "#6b5b8a", "#c9a96e"],
  ["#2a3a3a", "#4a6a5a", "#b8a878"],
  ["#3a2a2a", "#6a4a3a", "#c89868"],
  ["#2a2a3a", "#4a4a6a", "#9a8ac0"],
];

export default function ArtImage({
  src,
  seed = 0,
  alt = "",
  height = 200,
  radius = 16,
  badge,
  className,
}) {
  const [broken, setBroken] = useState(false);

  useEffect(() => setBroken(false), [src]);

  const showPhoto = Boolean(src) && !broken;
  const n = typeof seed === "number" ? seed : hashSeed(seed);
  const palette = PALETTES[n % PALETTES.length];

  return (
    <div
      className={[styles.wrap, className].filter(Boolean).join(" ")}
      style={{
        height,
        borderRadius: radius,
        background: showPhoto
          ? undefined
          : `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`,
      }}
    >
      {showPhoto ? (
        <img
          className={styles.photo}
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setBroken(true)}
        />
      ) : (
        <svg
          className={styles.pattern}
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <circle cx={30 + (n % 5) * 8} cy="40" r="26" fill={palette[2]} opacity="0.4" />
          <rect
            x="45"
            y="30"
            width="40"
            height="55"
            rx="3"
            fill={palette[2]}
            opacity="0.25"
            transform={`rotate(${(n % 7) * 5} 65 55)`}
          />
          <path
            d={`M10 ${75 + (n % 4) * 3} Q50 ${50 - (n % 5) * 4} 90 ${78 - (n % 3) * 2}`}
            stroke={palette[2]}
            strokeWidth="2"
            fill="none"
            opacity="0.5"
          />
        </svg>
      )}
      {badge && !showPhoto && <span className={styles.badge}>{badge}</span>}
    </div>
  );
}
