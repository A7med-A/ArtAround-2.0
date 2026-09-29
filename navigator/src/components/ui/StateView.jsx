import Icon from "./Icon";
import Button from "./Button";
import styles from "./StateView.module.css";

/** Schermata di caricamento a tutta altezza. */
export function LoadingState({ message = "Caricamento…" }) {
  return (
    <div className={styles.state} role="status" aria-live="polite">
      <div className={styles.spinner} />
      <div className={styles.hint}>{message}</div>
    </div>
  );
}

/** Errore di rete o del server, con azione di ripetizione. */
export function ErrorState({ title = "Qualcosa è andato storto", message, onRetry }) {
  return (
    <div className={styles.state} role="alert">
      <div className={[styles.badge, styles.badgeDanger].join(" ")}>
        <Icon name="alert" size={28} color="var(--danger)" />
      </div>
      <h2 className={styles.title}>{title}</h2>
      {message && <p className={styles.desc}>{message}</p>}
      {onRetry && (
        <Button variant="secondary" icon="refresh" onClick={onRetry}>
          Riprova
        </Button>
      )}
    </div>
  );
}

/** Nessun contenuto disponibile, con eventuale invito all'azione. */
export function EmptyState({ icon = "info", title, message, action }) {
  return (
    <div className={styles.state}>
      <div className={styles.badge}>
        <Icon name={icon} size={28} color="var(--gold)" />
      </div>
      {title && <h2 className={styles.title}>{title}</h2>}
      {message && <p className={styles.desc}>{message}</p>}
      {action}
    </div>
  );
}
