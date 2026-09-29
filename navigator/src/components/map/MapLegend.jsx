import { useMemo } from "react";
import Icon from "@/components/ui/Icon";
import { CELL_COLORS, CELL_ICONS, CELL_LABELS } from "@/constants/schema";
import styles from "./MapLegend.module.css";

/**
 * Legenda dei simboli. Elenca solo i tipi di cella davvero presenti sul
 * piano: una voce "Bar" su una pianta senza bar è rumore.
 */
export default function MapLegend({ floor }) {
  const entries = useMemo(() => {
    const counts = new Map();
    for (const cell of floor?.cells || []) {
      if (!CELL_ICONS[cell.type]) continue;
      counts.set(cell.type, (counts.get(cell.type) || 0) + 1);
    }
    return [...counts.entries()];
  }, [floor]);

  if (entries.length === 0) return null;

  return (
    <div className={styles.legend}>
      <div className={styles.grid}>
        {entries.map(([type, count]) => (
          <div key={type} className={styles.entry}>
            <Icon name={CELL_ICONS[type]} size={14} color={CELL_COLORS[type]} />
            <span className={styles.label}>{CELL_LABELS[type]}</span>
            {count > 1 && <span className={styles.count}>×{count}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
