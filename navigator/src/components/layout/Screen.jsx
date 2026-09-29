import Icon from "@/components/ui/Icon";
import styles from "./Screen.module.css";

/**
 * Contenitore a colonna: intestazione + corpo scrollabile + footer.
 *
 * `layout` fissa la larghezza massima del contenuto su desktop:
 *   "reading" (default) testo da leggere — la misura più stretta
 *   "wide"              griglie di schede
 *   "full"              mappa e fotocamera, che riempiono lo spazio
 * Su mobile non ha effetto: c'è una colonna sola.
 */
export default function Screen({ children, layout = "reading", className }) {
  const classes = [styles.screen, styles[layout], className].filter(Boolean).join(" ");
  return <div className={classes}>{children}</div>;
}

/**
 * Intestazione della schermata.
 * @param {function} onBack  se presente mostra la freccia indietro
 * @param {node} actions     controlli allineati a destra (voce, tema…)
 */
export function ScreenHeader({ eyebrow, title, subtitle, onBack, actions, plain }) {
  return (
    <header className={[styles.header, plain && styles.headerPlain].filter(Boolean).join(" ")}>
      <div className={styles.headerInner}>
        {onBack && (
          <button type="button" className={styles.back} onClick={onBack} aria-label="Indietro">
            <Icon name="chevL" size={22} color="var(--textSec)" />
          </button>
        )}
        <div className={styles.headings}>
          {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
          {title && <h1 className={styles.title}>{title}</h1>}
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
        {actions}
      </div>
    </header>
  );
}

export function ScreenBody({ children, padded = true, className }) {
  return (
    <div className={styles.body}>
      <div
        className={[styles.inner, padded && styles.innerPadded, className]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

export function ScreenFooter({ children }) {
  return (
    <div className={styles.footer}>
      <div className={styles.footerInner}>{children}</div>
    </div>
  );
}
