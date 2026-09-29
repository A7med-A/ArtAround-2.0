/** Marchio ArtAround: un mirino che "inquadra" l'opera. */
export default function Logo({ size = 40, color = "var(--gold)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" role="img" aria-label="ArtAround">
      <circle cx="20" cy="20" r="15" stroke={color} strokeWidth="2" />
      <circle cx="20" cy="20" r="6" fill={color} opacity="0.55" />
      <g stroke={color} strokeWidth="2" strokeLinecap="round">
        <line x1="20" y1="3" x2="20" y2="8" />
        <line x1="20" y1="32" x2="20" y2="37" />
        <line x1="3" y1="20" x2="8" y2="20" />
        <line x1="32" y1="20" x2="37" y2="20" />
      </g>
    </svg>
  );
}
