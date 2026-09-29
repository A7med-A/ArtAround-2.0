import { useState } from "react";
import { useNavigate } from "react-router-dom";
import IconButton from "@/components/ui/IconButton";
import Button from "@/components/ui/Button";
import Sheet from "@/components/ui/Sheet";
import { useAuth } from "@/context/AuthContext";
import { readJSON } from "@/lib/storage";
import { initials } from "@/lib/format";
import { ROUTES, STORAGE_KEYS } from "@/constants/config";
import styles from "./AccountMenu.module.css";

const ROLE_LABELS = {
  admin: "Amministratore",
  author: "Autore",
  docente: "Docente",
  visitor: "Visitatore",
};

/**
 * Chi sei e come uscire.
 *
 * Serve anche a chi è entrato come ospite e poi vuole accedere con il
 * proprio account — o al docente che ha bisogno di provare l'app dal
 * punto di vista di uno studente: senza questo, l'identità scelta al primo
 * accesso resterebbe l'unica possibile su quel dispositivo.
 */
export default function AccountMenu({ size = 40 }) {
  const navigate = useNavigate();
  const { user, isGuest, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const name = isGuest ? "Ospite" : user.username;
  const role = isGuest ? "Accesso senza account" : ROLE_LABELS[user.role] || user.role;

  // Uscire azzera anche il percorso in corso: meglio dirlo prima.
  const hasTour = Boolean(readJSON(STORAGE_KEYS.TOUR));
  const hasLive = Boolean(readJSON(STORAGE_KEYS.LIVE));

  const leave = (destination) => {
    logout();
    setOpen(false);
    navigate(destination, { replace: true });
  };

  return (
    <>
      <IconButton
        icon="user"
        size={size}
        iconSize={18}
        onClick={() => setOpen(true)}
        label={`Account: ${name}`}
      />

      {open && (
        <Sheet onClose={() => setOpen(false)} label="Il tuo account">
          <div className={styles.identity}>
            <span className={styles.avatar} aria-hidden="true">
              {isGuest ? "?" : initials(user.username)}
            </span>
            <span className={styles.who}>
              <span className={styles.name}>{name}</span>
              <span className={styles.role}>{role}</span>
            </span>
          </div>

          {isGuest && (
            <p className={styles.note}>
              Stai visitando senza account. Le preferenze di ascolto restano su
              questo dispositivo e non ti seguono altrove.
            </p>
          )}

          {(hasTour || hasLive) && (
            <p className={[styles.note, styles.warning].join(" ")}>
              {hasLive
                ? "Sei collegato a una visita guidata: uscendo verrai scollegato dalla classe."
                : "Hai una visita in corso: uscendo il punto in cui sei arrivato non verrà conservato."}
            </p>
          )}

          <div className={styles.actions}>
            {/* Per un ospite uscire e accedere sono la stessa azione: portano
                entrambe alla schermata di accesso. Un solo pulsante. */}
            <Button
              variant="primary"
              block
              icon={isGuest ? "user" : "logout"}
              onClick={() => leave(ROUTES.LOGIN)}
            >
              {isGuest ? "Esci e accedi con un account" : "Esci"}
            </Button>
            <Button variant="ghost" block onClick={() => setOpen(false)}>
              Annulla
            </Button>
          </div>
        </Sheet>
      )}
    </>
  );
}
