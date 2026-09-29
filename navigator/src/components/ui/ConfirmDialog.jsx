import { useEffect } from "react";
import Icon from "./Icon";
import Button from "./Button";
import Overlay from "./Overlay";
import styles from "./Dialog.module.css";

/** Dialogo modale di conferma. Si chiude con Esc o toccando fuori. */
export default function ConfirmDialog({
  icon = "info",
  title,
  message,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <Overlay>
      <div className={styles.overlay} onClick={onCancel} role="presentation">
        <div
          className={styles.dialog}
          onClick={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className={styles.badge}>
            <Icon name={icon} size={24} color="var(--gold)" />
          </div>
          <div className={styles.title}>{title}</div>
          {message && <div className={styles.message}>{message}</div>}
          <div className={styles.actions}>
            <Button variant="primary" onClick={onConfirm}>
              {confirmLabel}
            </Button>
            <Button variant="ghost" onClick={onCancel}>
              {cancelLabel}
            </Button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}
