import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Logo from "@/components/layout/Logo";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/config";
import styles from "./SplashScreen.module.css";

// Durata minima dello splash: sotto questa soglia il marchio lampeggerebbe
// e basta. Se la verifica del token dura di più, lo splash resta finché serve.
const MIN_SPLASH_MS = 900;

/**
 * Schermata d'avvio. Mentre è a schermo l'AuthProvider verifica il token
 * salvato contro /api/auth/me, poi si viene indirizzati alla lista musei
 * o all'accesso.
 */
export default function SplashScreen() {
  const { isReady, isAuthenticated } = useAuth();
  const [minElapsed, setMinElapsed] = useState(false);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const timeout = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    const interval = setInterval(() => {
      setProgress((p) => (p >= 92 ? p : p + 6));
    }, 60);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const done = isReady && minElapsed;

  if (done) {
    return <Navigate to={isAuthenticated ? ROUTES.MUSEUMS : ROUTES.LOGIN} replace />;
  }

  return (
    <div className={styles.splash}>
      <div className={styles.brand}>
        <Logo size={64} />
        <div className={styles.wordmark}>ArtAround</div>
        <div className={styles.tagline}>Navigator</div>
      </div>

      <div className={styles.loader}>
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.caption}>Caricamento contenuti…</div>
      </div>
    </div>
  );
}
