import Icon from "./Icon";
import styles from "./Pill.module.css";

/**
 * Etichetta compatta per metadati (sala, durata, tag…).
 *
 * @param {string} icon     nome icona opzionale
 * @param {"default"|"gold"|"outline"} variant
 * @param {string} color    forza un colore specifico (es. livello di approfondimento)
 */
export default function Pill({ children, icon, variant = "default", color, title }) {
  const className = [styles.pill, styles[variant]].filter(Boolean).join(" ");
  return (
    <span className={className} style={color ? { color } : undefined} title={title}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}
