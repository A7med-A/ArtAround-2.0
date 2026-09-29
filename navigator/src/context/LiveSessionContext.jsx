// ═══════════════════════════════════════════════════════════════
// LIVE SESSION — la visita guidata vista dallo studente.
//
// Differenza sostanziale rispetto a TourContext: qui la tappa non è
// una decisione dello studente ma un dato che arriva dal server, deciso
// dal docente. Lo studente conserva il controllo solo su *come* gli
// viene raccontata l'opera — livello e lunghezza del testo — e ogni sua
// richiesta viene segnalata al docente.
// ═══════════════════════════════════════════════════════════════

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { sessionsApi } from "@/api";
import { DEFAULT_PREFS, STORAGE_KEYS } from "@/constants/config";
import { readJSON, writeJSON, remove } from "@/lib/storage";
import { resolveText } from "@/lib/content";
import useSessionStream from "@/hooks/useSessionStream";

const LiveSessionContext = createContext(null);

function loadPrefs() {
  return { ...DEFAULT_PREFS, ...(readJSON(STORAGE_KEYS.PREFS, null) || {}) };
}

/** Credenziali di partecipazione salvate in locale. */
function loadMembership(code) {
  const saved = readJSON(STORAGE_KEYS.LIVE, null);
  if (!saved || (code && saved.code !== code)) return null;
  return saved;
}

export function LiveSessionProvider({ code, children }) {
  const [membership, setMembership] = useState(() => loadMembership(code));
  const [session, setSession] = useState(null);
  const [visit, setVisit] = useState(null);
  const [prefs, setPrefs] = useState(loadPrefs);
  const [myAnswers, setMyAnswers] = useState([]);
  const [myGrade, setMyGrade] = useState(null);
  const [loading, setLoading] = useState(Boolean(code));
  const [error, setError] = useState(null);

  useEffect(() => writeJSON(STORAGE_KEYS.PREFS, prefs), [prefs]);

  // ── Ingresso ───────────────────────────────────────────────────

  const join = useCallback(async (joinCode, name) => {
    const data = await sessionsApi.joinSession(joinCode, name);
    const next = {
      code: data.session.code,
      label: data.session.label,
      name,
      participantId: data.participantId,
      streamKey: data.streamKey,
    };
    writeJSON(STORAGE_KEYS.LIVE, next);
    setMembership(next);
    setSession(data.session);
    setVisit(data.visit);
    setError(null);
    return next;
  }, []);

  const leave = useCallback(() => {
    remove(STORAGE_KEYS.LIVE);
    setMembership(null);
    setSession(null);
    setVisit(null);
    setMyAnswers([]);
    setMyGrade(null);
  }, []);

  // ── Riallineamento all'avvio ───────────────────────────────────
  // Se la pagina viene ricaricata a metà visita, lo studente rientra con le
  // credenziali salvate e riparte dalla tappa in cui si trova la classe.

  useEffect(() => {
    if (!membership?.code || !membership?.streamKey) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;

    setLoading(true);
    sessionsApi
      .fetchState(membership.code, membership.streamKey)
      .then(async (state) => {
        if (cancelled) return;
        setSession(state.session);
        setMyAnswers(state.myAnswers || []);
        setMyGrade(state.myGrade || null);
        if (!visit) {
          // Il join restituisce anche la visita; qui la recuperiamo rientrando.
          const rejoined = await sessionsApi.joinSession(membership.code, membership.name);
          if (!cancelled) setVisit(rejoined.visit);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        // Sessione chiusa o chiave revocata: le credenziali locali non servono più.
        remove(STORAGE_KEYS.LIVE);
        setMembership(null);
        setError(err.message || "La visita non è più attiva");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membership?.code, membership?.streamKey]);

  // ── Stream ─────────────────────────────────────────────────────

  const streamHandlers = useMemo(
    () => ({
      stato: (data) => data && setSession(data),
      voto: (data) => data && setMyGrade(data),
      chiusa: () => {
        setSession((s) => (s ? { ...s, status: "conclusa" } : s));
      },
    }),
    [],
  );

  const { connected, error: streamError } = useSessionStream(
    membership?.code,
    membership?.streamKey,
    streamHandlers,
  );

  // ── Contenuto della tappa corrente ─────────────────────────────

  const items = useMemo(() => visit?.items || [], [visit]);
  const stopIndex = Math.min(session?.stopIndex ?? 0, Math.max(0, items.length - 1));
  const currentItem = items[stopIndex] || null;

  const content = useMemo(
    () => (currentItem ? resolveText(currentItem, prefs) : null),
    [currentItem, prefs],
  );

  // ── Preferenze: cambiano il racconto e avvisano il docente ─────

  const report = useCallback(
    (type, value) => {
      if (!membership) return;
      sessionsApi
        .reportEvent(membership.code, membership.streamKey, {
          type,
          value,
          itemId: currentItem?._id,
        })
        .catch(() => {
          // Il monitoraggio non deve mai bloccare l'ascolto: se la
          // segnalazione non arriva, lo studente continua comunque.
        });
    },
    [membership, currentItem],
  );

  const setTone = useCallback(
    (tone) => {
      setPrefs((p) => ({ ...p, tone }));
      report("tono", tone);
    },
    [report],
  );

  const setDuration = useCallback(
    (duration) => {
      setPrefs((p) => ({ ...p, duration }));
      report("durata", duration);
    },
    [report],
  );

  const setRate = useCallback((rate) => setPrefs((p) => ({ ...p, rate })), []);

  const reportReplay = useCallback(() => report("riascolto"), [report]);

  // ── Quiz ───────────────────────────────────────────────────────

  const answer = useCallback(
    async (questionIndex, choice) => {
      if (!membership) return;
      await sessionsApi.submitAnswer(membership.code, membership.streamKey, questionIndex, choice);
      setMyAnswers((prev) => [...prev, { questionIndex, choice }]);
    },
    [membership],
  );

  const answerFor = useCallback(
    (questionIndex) => myAnswers.find((a) => a.questionIndex === questionIndex) || null,
    [myAnswers],
  );

  const value = useMemo(
    () => ({
      membership,
      session,
      visit,
      items,
      stopIndex,
      currentItem,
      content,
      prefs,
      myAnswers,
      myGrade,
      loading,
      error: error || streamError,
      connected,
      isJoined: Boolean(membership && session),
      join,
      leave,
      setTone,
      setDuration,
      setRate,
      reportReplay,
      answer,
      answerFor,
    }),
    [
      membership, session, visit, items, stopIndex, currentItem, content, prefs,
      myAnswers, myGrade, loading, error, streamError, connected, join, leave,
      setTone, setDuration, setRate, reportReplay, answer, answerFor,
    ],
  );

  return <LiveSessionContext.Provider value={value}>{children}</LiveSessionContext.Provider>;
}

export function useLiveSession() {
  const ctx = useContext(LiveSessionContext);
  if (!ctx) throw new Error("useLiveSession deve essere usato dentro <LiveSessionProvider>");
  return ctx;
}
