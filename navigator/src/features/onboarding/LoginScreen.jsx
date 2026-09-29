import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Logo from "@/components/layout/Logo";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/config";
import styles from "./LoginScreen.module.css";

/**
 * Accesso al Navigator.
 *
 * L'accesso non è obbligatorio: "Continua come ospite" ottiene dal server
 * un token con ruolo `visitor`, sufficiente a leggere musei, opere e visite.
 * Registrarsi serve a ritrovare le proprie preferenze su un altro dispositivo.
 */
export default function LoginScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, login, register, continueAsGuest } = useAuth();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ identity: "", username: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null); // "submit" | "guest"

  if (isAuthenticated) return <Navigate to={ROUTES.MUSEUMS} replace />;

  const isRegister = mode === "register";
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const run = async (action, task, to = ROUTES.MUSEUMS) => {
    setError(null);
    setBusy(action);
    try {
      await task();
      navigate(to, { replace: true });
    } catch (err) {
      setError(err.message || "Accesso non riuscito");
    } finally {
      setBusy(null);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (isRegister) {
      run("submit", () =>
        register({
          username: form.username.trim().toLowerCase(),
          email: form.email.trim(),
          password: form.password,
        }),
      );
    } else {
      run("submit", () => login(form.identity.trim(), form.password));
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.inner}>
        <div className={styles.intro}>
          <Logo size={44} />
          <h1 className={styles.title}>{isRegister ? "Crea il tuo account" : "Bentornato"}</h1>
          <p className={styles.subtitle}>
            {isRegister
              ? "Ritrova le tue preferenze di ascolto su ogni dispositivo"
              : "Accedi per iniziare la tua visita"}
          </p>
        </div>

        <form className={styles.form} onSubmit={onSubmit}>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          {isRegister ? (
            <>
              <div className={styles.field}>
                <Icon name="user" size={18} color="var(--textMuted)" />
                <input
                  className={styles.input}
                  type="text"
                  autoComplete="username"
                  value={form.username}
                  onChange={update("username")}
                  placeholder="Nome utente"
                  required
                />
              </div>
              <div className={styles.field}>
                <Icon name="mail" size={18} color="var(--textMuted)" />
                <input
                  className={styles.input}
                  // `type="text"` e non `email`: il formato non viene
                  // verificato. `inputMode` serve solo a proporre la tastiera
                  // con la chiocciola sul telefono.
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={update("email")}
                  placeholder="La tua email"
                  required
                />
              </div>
            </>
          ) : (
            <div className={styles.field}>
              <Icon name="mail" size={18} color="var(--textMuted)" />
              <input
                className={styles.input}
                type="text"
                autoComplete="username"
                value={form.identity}
                onChange={update("identity")}
                placeholder="Email o nome utente"
                required
              />
            </div>
          )}

          <div className={styles.field}>
            <Icon name="lock" size={18} color="var(--textMuted)" />
            <input
              className={styles.input}
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={form.password}
              onChange={update("password")}
              placeholder="Password"
              required
            />
          </div>

          <Button type="submit" variant="primary" block disabled={busy !== null}>
            {busy === "submit" ? "Attendi…" : isRegister ? "Registrati" : "Accedi"}
          </Button>

          <div className={styles.switch}>
            {isRegister ? "Hai già un account?" : "Non hai un account?"}
            <button
              type="button"
              className={styles.switchLink}
              onClick={() => {
                setMode(isRegister ? "login" : "register");
                setError(null);
              }}
            >
              {isRegister ? "Accedi" : "Registrati"}
            </button>
          </div>

          <div className={styles.divider}>
            <span className={styles.line} />
            <span className={styles.dividerText}>oppure</span>
            <span className={styles.line} />
          </div>

          <Button
            type="button"
            variant="secondary"
            block
            icon="user"
            disabled={busy !== null}
            onClick={() => run("guest", continueAsGuest)}
          >
            {busy === "guest" ? "Attendi…" : "Continua come ospite"}
          </Button>
          <p className={styles.guestNote}>
            Come ospite puoi visitare tutti i musei. Le preferenze di ascolto
            restano su questo dispositivo.
          </p>

          {/* Chi è in gita con la classe non deve cercare il museo:
              gli serve solo il codice dettato dall'insegnante. */}
          <button
            type="button"
            className={styles.classLink}
            disabled={busy !== null}
            onClick={() => run("classe", continueAsGuest, ROUTES.JOIN)}
          >
            <Icon name="headphones" size={16} color="var(--gold)" />
            Sei in gita con la classe? Entra nella visita
          </button>
        </form>
      </div>
    </div>
  );
}
