import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Screen, { ScreenBody, ScreenHeader } from "@/components/layout/Screen";
import Icon from "@/components/ui/Icon";
import Pill from "@/components/ui/Pill";
import Button from "@/components/ui/Button";
import { ErrorState, LoadingState } from "@/components/ui/StateView";
import { sessionsApi } from "@/api";
import useAsync from "@/hooks/useAsync";
import { useMuseum } from "@/context/MuseumContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { estimateVisitMinutes } from "@/lib/content";
import { plural } from "@/lib/format";
import { ROUTES, SESSION_STATUS_LABELS } from "@/constants/config";
import styles from "./SessionsScreen.module.css";

/**
 * Punto di partenza del docente.
 *
 * Elenca le visite guidate preparate nel Marketplace e le sessioni già
 * aperte. Aprire una sessione genera il codice da dettare alla
 * classe: è l'unica cosa che gli studenti devono digitare.
 */
export default function SessionsScreen() {
  const navigate = useNavigate();
  const { slug, museum, visits } = useMuseum();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [opening, setOpening] = useState(null);

  const load = useCallback(() => sessionsApi.fetchSessions(slug), [slug]);
  const { data: sessions, loading, error, reload } = useAsync(load, [slug]);

  // Un docente conduce solo le visite che ha preparato lui: quelle pubbliche
  // del museo le legge per comporre i percorsi, ma il server non le lascerebbe
  // attivare, quindi non ha senso proporgliele.
  const guided = visits.filter(
    (v) => v.mode === "guidata" && (user?.role !== "docente" || v.createdBy === user.username),
  );
  const open = (sessions || []).filter((s) => s.status !== "conclusa");
  const past = (sessions || []).filter((s) => s.status === "conclusa");

  const openSession = async (visit) => {
    setOpening(visit._id);
    try {
      const data = await sessionsApi.openSession(slug, visit._id);
      showToast(`Visita "${data.session.label}" pronta`, "success");
      navigate(ROUTES.console(slug, data.session.code));
    } catch (err) {
      showToast(err.message || "Impossibile aprire la visita", "error");
      setOpening(null);
    }
  };

  const badgeClass = (status) =>
    [
      styles.badge,
      status === "in-corso" && styles.badgeLive,
      status === "quiz" && styles.badgeQuiz,
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <Screen layout="wide">
      <ScreenHeader
        eyebrow={museum.name}
        title="Conduci una visita"
        subtitle="Apri una sessione e detta il codice alla classe"
        onBack={() => navigate(ROUTES.museum(slug))}
      />

      <ScreenBody>
        {loading ? (
          <LoadingState message="Carico le tue visite…" />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <>
            {open.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  <span className={styles.sectionTitleText}>Sessioni aperte</span>
                  <span className={styles.rule} />
                </div>
                <div className={styles.list}>
                  {open.map((session) => (
                    <Link
                      key={session.code}
                      to={ROUTES.console(slug, session.code)}
                      className={styles.session}
                    >
                      <div className={styles.visitBody}>
                        <div className={styles.sessionLabel}>{session.label}</div>
                        <div className={styles.sessionMeta}>
                          {plural(session.students, "studente collegato", "studenti collegati")}
                        </div>
                      </div>
                      <span className={badgeClass(session.status)}>
                        {SESSION_STATUS_LABELS[session.status]}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <span className={styles.sectionTitleText}>Visite guidate disponibili</span>
                <span className={styles.rule} />
              </div>

              {guided.length === 0 ? (
                <div className={styles.empty}>
                  Non hai ancora visite in questo museo. Preparane una dal
                  Marketplace: scegli le opere — anche il tuo materiale privato —
                  e aggiungi le domande del quiz. Le visite che crei sono già
                  guidate: potrai condurle da qui.
                </div>
              ) : (
                <div className={styles.list}>
                  {guided.map((visit) => (
                    <div key={visit._id} className={styles.visit}>
                      <div className={styles.visitBody}>
                        <div className={styles.visitTitle}>{visit.title}</div>
                        <div className={styles.visitMeta}>
                          <Pill icon="grid">
                            {plural(visit.items?.length || 0, "tappa", "tappe")}
                          </Pill>
                          <Pill icon="clock">{estimateVisitMinutes(visit.items)} min</Pill>
                          {visit.quiz?.length > 0 && (
                            <Pill icon="check">
                              {plural(visit.quiz.length, "domanda", "domande")}
                            </Pill>
                          )}
                          {visit.items?.some((i) => i.visibility === "privata") && (
                            <Pill icon="lock" variant="gold">
                              con materiale privato
                            </Pill>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={opening !== null}
                        onClick={() => openSession(visit)}
                      >
                        {opening === visit._id ? "Apro…" : "Attiva"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {past.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  <span className={styles.sectionTitleText}>Concluse</span>
                  <span className={styles.rule} />
                </div>
                <div className={styles.list}>
                  {past.slice(0, 6).map((session) => (
                    <Link
                      key={session.code}
                      to={ROUTES.console(slug, session.code)}
                      className={styles.session}
                    >
                      <div className={styles.visitBody}>
                        <div className={styles.sessionLabel}>{session.label}</div>
                        <div className={styles.sessionMeta}>
                          {plural(session.students, "studente", "studenti")} ·{" "}
                          {new Date(session.createdAt).toLocaleDateString("it-IT")}
                        </div>
                      </div>
                      <Icon name="chevR" size={18} color="var(--textMuted)" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </ScreenBody>
    </Screen>
  );
}
