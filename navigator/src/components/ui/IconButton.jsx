import Icon from "./Icon";
import styles from "./Button.module.css";

/** Bottone quadrato a sola icona, con badge numerico opzionale. */
export default function IconButton({
  icon,
  onClick,
  active,
  size = 44,
  iconSize = 20,
  badge,
  label,
  disabled,
}) {
  const classes = [styles.iconBtn, active && styles.iconActive].filter(Boolean).join(" ");
  return (
    <button
      type="button"
      className={classes}
      style={{ width: size, height: size }}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <Icon name={icon} size={iconSize} color={active ? "var(--gold)" : "var(--textSec)"} />
      {badge != null && <span className={styles.badge}>{badge}</span>}
    </button>
  );
}
