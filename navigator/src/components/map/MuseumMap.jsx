import { useMemo } from "react";
import Icon from "@/components/ui/Icon";
import useMapNavigation from "@/hooks/useMapNavigation";
import { clusterCells } from "@/lib/museumMap";
import { CELL_COLORS, CELL_FILLS, CELL_ICONS, CELL_LABELS } from "@/constants/schema";
import styles from "./MuseumMap.module.css";

// Geometria della pianta: lato cella + spessore della fuga.
const CELL = 16;
const GAP = 1;
const STEP = CELL + GAP;

/** Centro della cella (x,y) in coordinate del canvas. */
const center = (n) => n * STEP + CELL / 2;

/** Tipi che meritano un pin: i muri no, disegnano già la pianta. */
const PIN_TYPES = ["item", "uscita", "ingresso", "bagno", "bar"];

/**
 * Pianta interattiva di un piano del museo.
 *
 * Disegna solo le celle presenti in `floor.cells` — lo schema del server
 * è sparso, quindi tutto ciò che non è elencato è pavimento libero.
 *
 * @param {object} floor        piano da Museum.floors[]
 * @param {object} userPosition {x,y} posizione del visitatore
 * @param {object} target       {x,y} destinazione evidenziata
 * @param {Array}  path         percorso calcolato, da findPath()
 * @param {string} highlightType tipo di cella da far risaltare (ricerca servizi)
 */
export default function MuseumMap({
  floor,
  userPosition,
  target,
  path = [],
  highlightType,
  onCellClick,
}) {
  const { containerRef, zoom, pan, dragging, zoomIn, zoomOut, reset, handlers } =
    useMapNavigation(1);

  const pins = useMemo(() => (floor ? clusterCells(floor, PIN_TYPES) : []), [floor]);

  if (!floor) {
    return (
      <div className={styles.viewport}>
        <div className={styles.emptyPlan}>
          Questo museo non ha ancora una pianta pubblicata.
        </div>
      </div>
    );
  }

  const planWidth = floor.width * STEP;
  const planHeight = floor.height * STEP;
  const targetKey = target ? `${target.x},${target.y}` : null;

  return (
    <div
      ref={containerRef}
      className={[styles.viewport, dragging && styles.grabbing].filter(Boolean).join(" ")}
      {...handlers}
    >
      <div
        className={styles.canvas}
        style={{
          transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <div
          className={styles.plan}
          style={{
            width: planWidth,
            height: planHeight,
            backgroundSize: `${STEP}px ${STEP}px`,
          }}
        >
          {/* Celle non vuote */}
          {floor.cells?.map((cell) => {
            const key = `${cell.x},${cell.y}`;
            const isTarget = key === targetKey;
            const isHighlighted = highlightType && cell.type === highlightType;
            return (
              <div
                key={key}
                className={styles.cell}
                onClick={onCellClick ? () => onCellClick(cell) : undefined}
                title={CELL_LABELS[cell.type]}
                style={{
                  left: cell.x * STEP,
                  top: cell.y * STEP,
                  width: CELL,
                  height: CELL,
                  background: isTarget
                    ? "color-mix(in srgb, var(--gold) 30%, transparent)"
                    : isHighlighted
                      ? "color-mix(in srgb, var(--gold) 40%, transparent)"
                      : CELL_FILLS[cell.type],
                  boxShadow: isHighlighted ? "inset 0 0 0 2px var(--gold)" : undefined,
                  cursor: onCellClick ? "pointer" : undefined,
                }}
              />
            );
          })}

          {/* Celle attraversate dal percorso, sotto la linea guida */}
          {path.length > 1 &&
            path.map((p) => (
              <div
                key={`path-${p.x},${p.y}`}
                className={styles.cell}
                style={{
                  left: p.x * STEP,
                  top: p.y * STEP,
                  width: CELL,
                  height: CELL,
                  background: "var(--goldBg)",
                  pointerEvents: "none",
                }}
              />
            ))}

          {/* Linea del percorso */}
          {path.length > 1 && (
            <svg className={styles.route} width={planWidth} height={planHeight}>
              <polyline
                points={path.map((p) => `${center(p.x)},${center(p.y)}`).join(" ")}
                fill="none"
                stroke="var(--gold)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="1 7"
                opacity="0.95"
              />
            </svg>
          )}

          {/* Punti di interesse */}
          {pins.map((pin) => {
            const isTarget =
              target &&
              pin.cells.some((c) => c.x === target.x && c.y === target.y);
            if (isTarget) return null; // sostituito dal pin di destinazione

            const size = pin.type === "item" ? CELL * 1.15 : CELL * 1.35;
            const color = CELL_COLORS[pin.type];
            const iconName = CELL_ICONS[pin.type];
            if (!iconName) return null;

            return (
              <div
                key={`pin-${pin.type}-${pin.x},${pin.y}`}
                className={styles.pin}
                title={CELL_LABELS[pin.type]}
                style={{
                  left: center(pin.x) - size / 2,
                  top: center(pin.y) - size / 2,
                  width: size,
                  height: size,
                  border: `1.5px solid ${color}`,
                }}
              >
                <Icon name={iconName} size={size * 0.56} color={color} />
              </div>
            );
          })}

          {/* Destinazione */}
          {target && (
            <div
              className={[styles.pin, styles.pinTarget].join(" ")}
              style={{
                left: center(target.x) - 16,
                top: center(target.y) - 16,
                width: 32,
                height: 32,
                background: "transparent",
                boxShadow: "none",
              }}
            >
              <span className={styles.ring} />
              <span className={styles.targetDot}>
                <Icon name="star" size={14} color="var(--onGold)" fill="var(--onGold)" />
              </span>
            </div>
          )}

          {/* Posizione del visitatore */}
          {userPosition && (
            <div
              className={styles.user}
              style={{ left: center(userPosition.x) - 9, top: center(userPosition.y) - 9 }}
              aria-label="La tua posizione"
            >
              <span className={styles.userRing} />
              <span className={styles.userDot} />
            </div>
          )}
        </div>
      </div>

      <div className={styles.youAreHere}>
        <span className={styles.youDot} />
        La tua posizione
      </div>

      <div className={styles.zoomControls}>
        <button type="button" className={styles.zoomBtn} onClick={zoomIn} aria-label="Ingrandisci">
          <Icon name="zoomIn" size={18} color="var(--text)" />
        </button>
        <button type="button" className={styles.zoomBtn} onClick={zoomOut} aria-label="Riduci">
          <Icon name="zoomOut" size={18} color="var(--text)" />
        </button>
        <button type="button" className={styles.zoomBtn} onClick={reset} aria-label="Centra la mappa">
          <Icon name="target" size={18} color="var(--text)" />
        </button>
      </div>
    </div>
  );
}
