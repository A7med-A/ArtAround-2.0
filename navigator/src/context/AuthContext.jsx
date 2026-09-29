// ═══════════════════════════════════════════════════════════════
// AUTH — sessione del visitatore.
//
// Il server protegge tutte le rotte /api/museums con JWT, quindi anche
// la modalità "ospite" ottiene un token: POST /api/auth/guest rilascia
// le credenziali dell'account condiviso con ruolo "visitor".
// ═══════════════════════════════════════════════════════════════

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { authApi } from "@/api";
import { getToken, setToken, UNAUTHORIZED_EVENT } from "@/api/client";
import { STORAGE_KEYS } from "@/constants/config";
import { readJSON, writeJSON, remove } from "@/lib/storage";

const AuthContext = createContext(null);

/** "loading" finché non sappiamo se il token salvato è ancora valido. */
export const AUTH_STATUS = {
  LOADING: "loading",
  AUTHENTICATED: "authenticated",
  ANONYMOUS: "anonymous",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readJSON(STORAGE_KEYS.USER));
  const [status, setStatus] = useState(AUTH_STATUS.LOADING);
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  const persist = useCallback((token, nextUser) => {
    setToken(token);
    if (nextUser) writeJSON(STORAGE_KEYS.USER, nextUser);
    else remove(STORAGE_KEYS.USER);
    setUser(nextUser || null);
    setStatus(nextUser ? AUTH_STATUS.AUTHENTICATED : AUTH_STATUS.ANONYMOUS);
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    remove(STORAGE_KEYS.USER);
    // Percorso libero e partecipazione a una visita guidata sono legati a
    // chi era collegato: restando in memoria riapparirebbero al prossimo
    // accesso, magari a un'altra persona sullo stesso dispositivo.
    remove(STORAGE_KEYS.TOUR);
    remove(STORAGE_KEYS.LIVE);
    setUser(null);
    setStatus(AUTH_STATUS.ANONYMOUS);
  }, []);

  // Al primo avvio: valida il token salvato contro /api/auth/me.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!getToken()) {
        setStatus(AUTH_STATUS.ANONYMOUS);
        return;
      }
      try {
        const me = await authApi.fetchMe();
        if (cancelled) return;
        writeJSON(STORAGE_KEYS.USER, me);
        setUser(me);
        setStatus(AUTH_STATUS.AUTHENTICATED);
      } catch (err) {
        if (cancelled) return;
        // Solo un 401 dice che il token non vale più. Un errore di rete —
        // server irraggiungibile, wi-fi del museo che cade — non deve
        // buttare fuori il visitatore a metà visita: si tiene l'utente in
        // cache e si riprova alla richiesta successiva.
        if (err.status === 401) clearSession();
        else if (readJSON(STORAGE_KEYS.USER)) setStatus(AUTH_STATUS.AUTHENTICATED);
        else setStatus(AUTH_STATUS.ANONYMOUS);
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, [clearSession]);

  // Il client Axios segnala i 401: la sessione è scaduta lato server.
  useEffect(() => {
    const onUnauthorized = () => clearSession();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [clearSession]);

  const login = useCallback(
    async (usernameOrEmail, password) => {
      const { token, user: logged } = await authApi.login(usernameOrEmail, password);
      persist(token, logged);
      return logged;
    },
    [persist],
  );

  const register = useCallback(
    async (payload) => {
      const { token, user: created } = await authApi.register(payload);
      persist(token, created);
      return created;
    },
    [persist],
  );

  const continueAsGuest = useCallback(async () => {
    const { token, user: guest } = await authApi.loginAsGuest();
    persist(token, guest);
    return guest;
  }, [persist]);

  const logout = useCallback(() => clearSession(), [clearSession]);

  const value = useMemo(
    () => ({
      user,
      status,
      isReady: status !== AUTH_STATUS.LOADING,
      isAuthenticated: status === AUTH_STATUS.AUTHENTICATED,
      isGuest: user?.username === "ospite",
      login,
      register,
      continueAsGuest,
      logout,
    }),
    [user, status, login, register, continueAsGuest, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve essere usato dentro <AuthProvider>");
  return ctx;
}
