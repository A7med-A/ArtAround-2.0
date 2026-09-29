import styles from "./FloorTabs.module.css";

/** Selettore dei piani. Nascosto quando il museo ha un piano solo. */
export default function FloorTabs({ floors, activeOrder, onChange }) {
  if (!floors || floors.length < 2) return null;

  return (
    <div className={styles.tabs} role="tablist" aria-label="Piani del museo">
      {floors.map((floor) => {
        const active = floor.order === activeOrder;
        return (
          <button
            key={floor.order}
            type="button"
            role="tab"
            aria-selected={active}
            className={[styles.tab, active && styles.active].filter(Boolean).join(" ")}
            onClick={() => onChange(floor.order)}
          >
            {floor.name}
          </button>
        );
      })}
    </div>
  );
}
