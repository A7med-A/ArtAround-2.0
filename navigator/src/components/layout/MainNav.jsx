import { Link, NavLink } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import Logo from "@/components/layout/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AccountMenu from "@/components/account/AccountMenu";
import { ROUTES } from "@/constants/config";
import styles from "./MainNav.module.css";

/** Le tre modalità d'uso durante la visita. */
const TABS = [
  { key: "tour", label: "Visita", icon: "headphones", to: ROUTES.tour },
  { key: "artworks", label: "Opere", icon: "grid", to: ROUTES.artworks },
  { key: "map", label: "Mappa", icon: "map", to: ROUTES.map },
];

/**
 * Navigazione principale della visita.
 *
 * Su desktop diventa una colonna laterale e mostra anche il museo in corso,
 * il ritorno all'elenco, il tema e le scorciatoie da tastiera: elementi che
 * su mobile vivono nelle intestazioni delle singole schermate, dove lo
 * spazio va tutto al contenuto.
 */
export default function MainNav({ slug, museumName }) {
  return (
    <nav className={styles.nav} aria-label="Sezioni della visita">
      <div className={styles.brand}>
        <div className={styles.brandRow}>
          <Logo size={26} />
          <span className={styles.brandName}>{museumName}</span>
        </div>
        <Link to={ROUTES.MUSEUMS} className={styles.brandLink}>
          <Icon name="chevL" size={14} />
          Tutti i musei
        </Link>
      </div>

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <NavLink
            key={tab.key}
            to={tab.to(slug)}
            className={({ isActive }) =>
              [styles.tab, isActive && styles.active].filter(Boolean).join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <span className={styles.bubble}>
                  <Icon
                    name={tab.icon}
                    size={20}
                    color={isActive ? "var(--gold)" : "var(--textMuted)"}
                  />
                </span>
                <span className={styles.label}>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className={styles.navFoot}>
        <span className={styles.hint}>
          <span className={styles.kbd}>←</span> <span className={styles.kbd}>→</span> tappe
          <br />
          <span className={styles.kbd}>Spazio</span> ascolta
        </span>
        <span className={styles.navFootActions}>
          <AccountMenu size={36} />
          <ThemeToggle size={36} />
        </span>
      </div>
    </nav>
  );
}
