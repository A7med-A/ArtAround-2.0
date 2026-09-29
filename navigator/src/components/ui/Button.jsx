import Icon from "./Icon";
import styles from "./Button.module.css";

/**
 * Bottone testuale.
 * @param {"primary"|"secondary"|"ghost"|"plain"} variant
 */
export default function Button({
  children,
  variant = "primary",
  size,
  icon,
  iconRight,
  block,
  type = "button",
  className,
  ...rest
}) {
  const classes = [styles.btn, styles[variant], size === "sm" && styles.sm, block && styles.block, className]
    .filter(Boolean)
    .join(" ");

  const iconColor = variant === "primary" ? "var(--onGold)" : "var(--gold)";

  return (
    <button type={type} className={classes} {...rest}>
      {icon && <Icon name={icon} size={18} color={iconColor} />}
      {children}
      {iconRight && <Icon name={iconRight} size={18} color={iconColor} />}
    </button>
  );
}
