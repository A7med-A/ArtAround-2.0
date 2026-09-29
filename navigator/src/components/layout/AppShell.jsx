import { OVERLAY_ROOT_ID } from "@/components/ui/Overlay";
import styles from "./AppShell.module.css";

/**
 * Contenitore radice dell'app: occupa la viewport e ospita il livello
 * degli overlay.
 *
 * La differenza fra mobile e desktop vive tutta nei CSS Modules delle
 * singole schermate: non esiste una versione "desktop" separata da
 * mantenere, né misurazioni della finestra in JavaScript.
 */
export default function AppShell({ children }) {
  return (
    <div className={styles.stage}>
      <div className={styles.frame}>
        {children}
        <div id={OVERLAY_ROOT_ID} className={styles.overlays} />
      </div>
    </div>
  );
}

/** Area scrollabile fra l'header e la barra di navigazione. */
export function ShellBody({ children }) {
  return <div className={styles.body}>{children}</div>;
}
