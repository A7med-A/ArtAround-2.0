import { useEffect } from "react";
import Overlay from "./Overlay";
import styles from "./Dialog.module.css";

/** Pannello che sale dal basso. Si chiude con Esc o toccando lo sfondo. */
export default function Sheet({ children, onClose, label }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <Overlay>
      <div className={styles.sheetOverlay} onClick={onClose} role="presentation">
        <div
          className={styles.sheet}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          <div className={styles.grabber} />
          {children}
        </div>
      </div>
    </Overlay>
  );
}
