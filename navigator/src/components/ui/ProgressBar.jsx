import styles from "./ProgressBar.module.css";

/** Barra di avanzamento; con `label` mostra anche testo e percentuale. */
export default function ProgressBar({ value, max, height = 6, label }) {
  const safeMax = Math.max(1, max || 1);
  const pct = Math.min(100, Math.max(0, (value / safeMax) * 100));

  return (
    <div>
      {label && (
        <div className={styles.head}>
          <span className={styles.label}>{label}</span>
          <span className={styles.pct}>{Math.round(pct)}%</span>
        </div>
      )}
      <div
        className={styles.track}
        style={{ height }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Avanzamento"}
      >
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
