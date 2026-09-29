import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { sessionsApi } from "@/api";
import { ROUTES, STORAGE_KEYS } from "@/constants/config";
import { writeJSON } from "@/lib/storage";
import styles from "./JoinScreen.module.css";

/**
 * Ingresso in una visita guidata.
 *
 * Lo studente digita il codice dettato dal docente ("428 517")
 * e il proprio nome. Nessuna registrazione: il nome serve al docente per
 * riconoscerlo nell'elenco dei collegati, e resta legato al dispositivo per
 * tutta la sessione.
 */
export default function JoinScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [code, setCode] = useState(searchParams.get("codice") || "");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data = await sessionsApi.joinSession(code.trim(), name.trim());
      writeJSON(STORAGE_KEYS.LIVE, {
        code: data.session.code,
        label: data.session.label,
        name: name.trim(),
        participantId: data.participantId,
        streamKey: data.streamKey,
      });
      navigate(ROUTES.live(data.session.code), { replace: true });
    } catch (err) {
      setError(err.message || "Non è stato possibile entrare");
      setBusy(false);
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.inner}>
        <div className={styles.badge}>
          <Icon name="headphones" size={26} color="var(--gold)" />
        </div>

        <h1 className={styles.title}>Entra nella visita</h1>
        <p className={styles.subtitle}>
          Digita il codice che ti ha dettato il tuo insegnante e il tuo nome. Da
          quel momento seguirai la visita insieme alla classe.
        </p>

        <form className={styles.form} onSubmit={onSubmit}>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          <span className={styles.label}>Codice della visita</span>
          <div className={styles.field}>
            <Icon name="lock" size={18} color="var(--gold)" />
            <input
              className={[styles.input, styles.codeInput].join(" ")}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="428 517"
              // Sul telefono apre il tastierino numerico invece della
              // tastiera alfabetica: sei cifre si battono in un attimo.
              inputMode="numeric"
              autoComplete="off"
              required
              aria-label="Codice della visita"
            />
          </div>

          <span className={styles.label}>Il tuo nome</span>
          <div className={styles.field}>
            <Icon name="user" size={18} color="var(--textMuted)" />
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Come ti chiami"
              autoComplete="given-name"
              required
              minLength={2}
              maxLength={60}
              aria-label="Il tuo nome"
            />
          </div>

          <Button type="submit" variant="primary" block disabled={busy}>
            {busy ? "Entro…" : "Entra"}
          </Button>

          <p className={styles.hint}>
            Sono sei cifre. Puoi scriverle di seguito o separate: 428517 e
            428 517 valgono lo stesso.
          </p>

          <button type="button" className={styles.back} onClick={() => navigate(ROUTES.MUSEUMS)}>
            Torna ai musei
          </button>
        </form>
      </div>
    </div>
  );
}
