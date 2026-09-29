import Icon from "./Icon";
import styles from "./Button.module.css";

/**
 * Comando grande con icona, etichetta e sottotitolo.
 * Pensato per essere premuto camminando, senza guardare lo schermo:
 * area di tocco alta almeno 54 px e feedback tattile allo `:active`.
 */
export default function BigButton({ icon, label, sub, primary, disabled, onClick, title }) {
  const classes = [styles.big, primary && styles.bigPrimary].filter(Boolean).join(" ");
  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      aria-label={sub ? `${label} — ${sub}` : label}
    >
      <Icon name={icon} size={18} color={primary ? "var(--onGold)" : "var(--gold)"} />
      <span className={styles.bigLabel}>{label}</span>
      {sub && <span className={styles.bigSub}>{sub}</span>}
    </button>
  );
}
