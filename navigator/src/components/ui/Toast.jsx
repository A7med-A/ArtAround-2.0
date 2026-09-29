import styles from "./Toast.module.css";

/** Messaggio effimero. Annunciato agli screen reader via aria-live. */
export default function Toast({ message, variant = "default" }) {
  return (
    <div className={[styles.toast, styles[variant]].filter(Boolean).join(" ")} role="status" aria-live="polite">
      {message}
    </div>
  );
}
