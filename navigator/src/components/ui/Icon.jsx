import { ICON_PATHS } from "./icons";

/**
 * Icona SVG a tratto.
 *
 * @param {string} name    chiave di ICON_PATHS
 * @param {number} size    lato in px
 * @param {string} color   colore del tratto (default: colore del testo corrente)
 * @param {string} fill    riempimento (usato da play/pause/stop)
 * @param {string} title   se presente l'icona è esposta agli screen reader
 */
export default function Icon({
  name,
  size = 22,
  color = "currentColor",
  strokeWidth = 1.7,
  fill = "none",
  title,
  style,
}) {
  const d = ICON_PATHS[name];
  if (!d) return null;
  const paths = Array.isArray(d) ? d : [d];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : "true"}
      style={{ flexShrink: 0, display: "block", ...style }}
    >
      {title && <title>{title}</title>}
      {paths.map((path, i) => (
        <path key={i} d={path} />
      ))}
    </svg>
  );
}
