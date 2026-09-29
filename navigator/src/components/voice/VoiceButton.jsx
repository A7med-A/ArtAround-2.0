import Icon from "@/components/ui/Icon";
import styles from "./Voice.module.css";

/** Apre l'assistente vocale. Presente in tutte le schermate della visita. */
export default function VoiceButton({ onClick }) {
  return (
    <button type="button" className={styles.trigger} onClick={onClick} aria-label="Assistente vocale">
      <Icon name="mic" size={14} color="var(--gold)" />
      Voce
    </button>
  );
}
