import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Screen, { ScreenBody } from "@/components/layout/Screen";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ErrorState, LoadingState } from "@/components/ui/StateView";
import { sessionsApi } from "@/api";
import useSessionStream from "@/hooks/useSessionStream";
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";
import { useToast } from "@/context/ToastContext";
import { plural } from "@/lib/format";
import { ROUTES, SESSION_STATUS_LABELS } from "@/constants/config";
import styles from "./ConsoleScreen.module.css";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

const EVENT_LABELS = {
  tono: "ha chiesto un livello",
  durata: "ha chiesto una lunghezza",
  riascolto: "ha riascoltato l'opera",
  ingresso: "è entrata nella visita",
  uscita: "è uscita dalla visita",
};

const EVENT_ICONS = {
  tono: "book",
  durata: "layers",
  riascolto: "refresh",
  ingresso: "enter",
  uscita: "exit",
};

const clock = (iso) =>
  new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

/**
 * Console del docente durante la visita.
 *
 * È l'unico punto da cui si comanda la sessione: qui si avanza fra le
 * opere — e tutta la classe si sposta con lui — si controlla chi è
 * collegato, si legge cosa ha chiesto ciascuno e si conduce il quiz.
 *
 * Lo stato arriva da una lettura iniziale (`/monitor`) e resta aggiornato
 * dallo stream SSE, sullo stesso canale che serve gli studenti.
 */
export default function ConsoleScreen() {
  const { slug, code } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [session, setSession] = useState(null);
  const [visit, setVisit] = useState(null);
  const [streamKey, setStreamKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("visita");
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [busy, setBusy] = useState(false);

  const reloadRef = useRef(null);

  // ── Caricamento ────────────────────────────────────────────────

  const load = useCallback(async () => {
    try {
      const data = await sessionsApi.fetchMonitor(code);
      setSession(data.session);
      setVisit(data.visit);
      setStreamKey(data.streamKey);
      setError(null);
    } catch (err) {
      setError(err.message || "Sessione non raggiungibile");
    } finally {
      setLoading(false);
    }
  }, [code]);
  reloadRef.current = load;

  useEffect(() => {
    load();
  }, [load]);

  // ── Stream ─────────────────────────────────────────────────────

  const handlers = useMemo(
    () => ({
      stato: (data) =>
        data &&
        setSession((s) =>
          s
            ? {
                ...s,
                status: data.status,
                stopIndex: data.stopIndex,
                questionIndex: data.questionIndex,
                acceptingAnswers: data.acceptingAnswers,
              }
            : s,
        ),
      partecipanti: (data) =>
        data &&
        setSession((s) => {
          if (!s) return s;
          // Il roster dallo stream porta lo stato di collegamento aggiornato;
          // gli altri campi del partecipante restano quelli già noti.
          const byId = new Map(s.participants.map((p) => [String(p._id), p]));
          return {
            ...s,
            participants: data.participants.map((p) => ({
              ...(byId.get(p.id) || {}),
              _id: p.id,
              name: p.name,
              role: p.role,
              joinedAt: p.joinedAt,
              online: p.online,
            })),
          };
        }),
      attivita: (data) =>
        data?.event && setSession((s) => (s ? { ...s, events: [...s.events, data.event] } : s)),
      risposta: (data) =>
        data &&
        setSession((s) =>
          s
            ? {
                ...s,
                answers: [
                  ...s.answers,
                  {
                    participant: data.participantId,
                    participantName: data.participantName,
                    questionIndex: data.questionIndex,
                    choice: data.choice,
                    correct: data.correct,
                    at: new Date().toISOString(),
                  },
                ],
              }
            : s,
        ),
    }),
    [],
  );

  const { connected } = useSessionStream(code, streamKey, handlers);

  // ── Comandi ────────────────────────────────────────────────────

  const control = useCallback(
    async (patch, message) => {
      setBusy(true);
      try {
        const updated = await sessionsApi.controlSession(code, patch);
        setSession(updated);
        if (message) showToast(message);
      } catch (err) {
        showToast(err.message || "Comando non riuscito", "error");
      } finally {
        setBusy(false);
      }
    },
    [code, showToast],
  );

  const items = visit?.items || [];
  const quiz = visit?.quiz || [];
  const students = (session?.participants || []).filter((p) => p.role === "studente");
  const onlineCount = students.filter((p) => p.online).length;
  const stopIndex = session?.stopIndex ?? 0;
  const isRunning = session?.status === "in-corso";

  const goToStop = useCallback(
    (index) => {
      if (index < 0 || index >= items.length) return;
      control({ stopIndex: index });
    },
    [items.length, control],
  );

  useKeyboardShortcuts(
    useMemo(
      () => ({
        ArrowRight: () => isRunning && goToStop(stopIndex + 1),
        ArrowLeft: () => isRunning && goToStop(stopIndex - 1),
      }),
      [isRunning, goToStop, stopIndex],
    ),
    !confirmEnd,
  );

  // ── Dati derivati ──────────────────────────────────────────────

  const studentEvents = useMemo(
    () => (session?.events || []).filter((e) => e.type !== "ingresso").slice().reverse(),
    [session],
  );

  const answersForQuestion = useMemo(() => {
    const index = session?.questionIndex ?? 0;
    return (session?.answers || []).filter((a) => a.questionIndex === index);
  }, [session]);

  if (loading) return <LoadingState message="Apro la console…" />;
  if (error || !session) {
    return (
      <ErrorState
        title="Sessione non disponibile"
        message={error}
        onRetry={() => navigate(ROUTES.sessions(slug), { replace: true })}
      />
    );
  }

  const statusClass = [
    styles.statusBadge,
    session.status === "in-corso" && styles.statusLive,
    session.status === "quiz" && styles.statusQuiz,
  ]
    .filter(Boolean)
    .join(" ");

  const TABS = [
    { id: "visita", label: "Visita", icon: "headphones" },
    { id: "classe", label: "Classe", icon: "user", count: onlineCount },
    { id: "attivita", label: "Attività", icon: "list", count: studentEvents.length },
    { id: "quiz", label: "Quiz", icon: "check", count: quiz.length },
  ];

  return (
    <Screen className={styles.console}>
      <div className={styles.head}>
        <div className={styles.headInner}>
          <button
            type="button"
            className={styles.back}
            onClick={() => navigate(ROUTES.sessions(slug))}
            aria-label="Torna alle sessioni"
          >
            <Icon name="chevL" size={18} color="var(--textSec)" />
          </button>
          <div className={styles.headMain}>
            <div className={styles.eyebrow}>Codice da dettare alla classe</div>
            <div className={styles.label}>{session.label}</div>
          </div>
          <div className={styles.status}>
            <span className={statusClass}>{SESSION_STATUS_LABELS[session.status]}</span>
            {!connected && (
              <Icon name="alert" size={16} color="var(--danger)" title="Stream interrotto" />
            )}
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        <div className={styles.tabsInner}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={[styles.tab, tab === t.id && styles.tabActive].filter(Boolean).join(" ")}
              onClick={() => setTab(t.id)}
            >
              <Icon
                name={t.icon}
                size={15}
                color={tab === t.id ? "var(--gold)" : "var(--textMuted)"}
              />
              {t.label}
              {t.count > 0 && <span className={styles.tabCount}>{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <ScreenBody>
        {/* ── Conduzione della visita ── */}
        {tab === "visita" && (
          <>
            {session.status === "attesa" && (
              <div className={[styles.card, styles.cardGold].join(" ")}>
                <div className={styles.cardLabel}>Prima di cominciare</div>
                <div className={styles.cardSub}>
                  Detta alla classe il codice <strong>{session.label}</strong>. Quando tutti
                  sono collegati — vedi la scheda Classe — avvia la visita.
                </div>
                <div className={styles.actions}>
                  <Button
                    variant="primary"
                    disabled={busy}
                    onClick={() => control({ status: "in-corso" }, "Visita avviata")}
                  >
                    Avvia la visita
                  </Button>
                </div>
              </div>
            )}

            {items[stopIndex] && (
              <div className={styles.card}>
                <div className={styles.cardLabel}>
                  Tappa {stopIndex + 1} di {items.length}
                  {items[stopIndex].visibility === "privata" && " · materiale privato"}
                </div>
                <div className={styles.cardTitle}>{items[stopIndex].title}</div>
                <div className={styles.cardSub}>{items[stopIndex].artist}</div>
                <div className={styles.actions}>
                  <Button
                    variant="secondary"
                    icon="prev"
                    disabled={busy || !isRunning || stopIndex === 0}
                    onClick={() => goToStop(stopIndex - 1)}
                  >
                    Indietro
                  </Button>
                  <Button
                    variant="primary"
                    iconRight="next"
                    disabled={busy || !isRunning || stopIndex >= items.length - 1}
                    onClick={() => goToStop(stopIndex + 1)}
                  >
                    Avanti
                  </Button>
                </div>
              </div>
            )}

            <div className={styles.stops}>
              {items.map((item, i) => (
                <button
                  key={item._id}
                  type="button"
                  className={[styles.stop, i === stopIndex && styles.stopCurrent]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => goToStop(i)}
                  disabled={busy || !isRunning}
                >
                  <span className={styles.stopNumber}>{i + 1}</span>
                  <span className={styles.stopBody}>
                    <span className={styles.stopTitle}>{item.title}</span>
                    <span className={styles.stopSub}>
                      {item.artist}
                      {item.visibility === "privata" ? " · privata" : ""}
                    </span>
                  </span>
                  {item.visibility === "privata" && (
                    <Icon name="lock" size={15} color="var(--gold)" />
                  )}
                </button>
              ))}
            </div>

            {isRunning && quiz.length > 0 && (
              <div className={styles.actions} style={{ marginTop: 18 }}>
                <Button
                  variant="secondary"
                  icon="check"
                  disabled={busy}
                  onClick={() => {
                    control(
                      { status: "quiz", questionIndex: 0, acceptingAnswers: true },
                      "Quiz avviato",
                    );
                    setTab("quiz");
                  }}
                >
                  Passa al quiz
                </Button>
              </div>
            )}

            {session.status !== "conclusa" && (
              <div className={styles.actions} style={{ marginTop: 10 }}>
                <Button variant="ghost" disabled={busy} onClick={() => setConfirmEnd(true)}>
                  Concludi la visita
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── Chi è collegato ── */}
        {tab === "classe" && (
          <>
            <div className={styles.counters}>
              <div className={styles.counter}>
                <div className={styles.counterValue}>{students.length}</div>
                <div className={styles.counterLabel}>Iscritti</div>
              </div>
              <div className={styles.counter}>
                <div className={styles.counterValue}>{onlineCount}</div>
                <div className={styles.counterLabel}>Collegati ora</div>
              </div>
              <div className={styles.counter}>
                <div className={styles.counterValue}>{studentEvents.length}</div>
                <div className={styles.counterLabel}>Richieste</div>
              </div>
              <div className={styles.counter}>
                <div className={styles.counterValue}>{session.answers.length}</div>
                <div className={styles.counterLabel}>Risposte</div>
              </div>
            </div>

            {students.length === 0 ? (
              <div className={styles.empty}>
                Nessuno si è ancora collegato. Detta alla classe il codice{" "}
                <strong>{session.label}</strong>: gli studenti lo digitano nella schermata
                “Entra nella visita”.
              </div>
            ) : (
              <div className={styles.people}>
                {students.map((p) => (
                  <div key={p._id} className={styles.person}>
                    <span
                      className={[styles.personDot, p.online && styles.personOnline]
                        .filter(Boolean)
                        .join(" ")}
                      title={p.online ? "Collegato" : "Non collegato"}
                    />
                    <span className={styles.personName}>{p.name}</span>
                    <span className={styles.personMeta}>
                      {p.online ? "collegato" : `visto ${clock(p.lastSeenAt || p.joinedAt)}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Chi ha chiesto cosa ── */}
        {tab === "attivita" && (
          <>
            {studentEvents.length === 0 ? (
              <div className={styles.empty}>
                Nessuna richiesta finora. Qui compaiono in tempo reale gli studenti che
                chiedono un testo più semplice, più approfondito o più esteso.
              </div>
            ) : (
              <div className={styles.feed}>
                {studentEvents.map((e, i) => (
                  <div key={`${e.at}-${i}`} className={styles.entry}>
                    <span className={styles.entryIcon}>
                      <Icon
                        name={EVENT_ICONS[e.type] || "info"}
                        size={16}
                        color="var(--gold)"
                      />
                    </span>
                    <span className={styles.entryBody}>
                      <span className={styles.entryName}>{e.participantName}</span>
                      <span className={styles.entryWhat}>
                        {EVENT_LABELS[e.type] || e.type}
                        {e.value ? `: ${e.value}` : ""} · tappa {(e.stopIndex ?? 0) + 1}
                      </span>
                    </span>
                    <span className={styles.entryTime}>{clock(e.at)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Quiz e voti ── */}
        {tab === "quiz" && (
          <QuizConsole
            session={session}
            quiz={quiz}
            answers={answersForQuestion}
            students={students}
            busy={busy}
            control={control}
            onGrades={async (body) => {
              setBusy(true);
              try {
                const updated = await sessionsApi.saveGrades(code, body);
                setSession(updated);
                showToast(body.participantId ? "Voto aggiornato" : "Voti calcolati", "success");
              } catch (err) {
                showToast(err.message || "Operazione non riuscita", "error");
              } finally {
                setBusy(false);
              }
            }}
          />
        )}
      </ScreenBody>

      {confirmEnd && (
        <ConfirmDialog
          icon="exit"
          title="Concludere la visita?"
          message="Gli studenti vedranno la schermata finale con il proprio voto, se lo hai pubblicato. Nessuno potrà più collegarsi."
          confirmLabel="Concludi"
          cancelLabel="Annulla"
          onConfirm={() => {
            setConfirmEnd(false);
            control({ status: "conclusa" }, "Visita conclusa");
          }}
          onCancel={() => setConfirmEnd(false)}
        />
      )}
    </Screen>
  );
}

/** Conduzione del quiz e assegnazione dei voti. */
function QuizConsole({ session, quiz, answers, students, busy, control, onGrades }) {
  const index = session.questionIndex ?? 0;
  const question = quiz[index];
  const inQuiz = session.status === "quiz";

  if (quiz.length === 0) {
    return (
      <div className={styles.empty}>
        Questa visita non ha domande. Puoi aggiungerle dal Marketplace, nella scheda
        della visita: ogni domanda ha da due a sei risposte e una sola corretta.
      </div>
    );
  }

  if (!inQuiz && session.status !== "conclusa") {
    return (
      <div className={styles.card}>
        <div className={styles.cardLabel}>Quiz pronto</div>
        <div className={styles.cardTitle}>{plural(quiz.length, "domanda", "domande")}</div>
        <div className={styles.cardSub}>
          Avvialo quando la visita è finita: gli studenti passeranno automaticamente
          alle domande.
        </div>
        <div className={styles.actions}>
          <Button
            variant="primary"
            disabled={busy}
            onClick={() =>
              control({ status: "quiz", questionIndex: 0, acceptingAnswers: true }, "Quiz avviato")
            }
          >
            Avvia il quiz
          </Button>
        </div>
      </div>
    );
  }

  const counts = question ? question.options.map((_, i) => answers.filter((a) => a.choice === i).length) : [];
  const total = answers.length;
  const grades = session.grades || [];

  /** Salva il voto solo se è davvero cambiato ed è un numero valido. */
  const commitMark = (raw, grade) => {
    const mark = Number(raw);
    if (!Number.isFinite(mark) || mark === grade.mark) return;
    onGrades({ participantId: String(grade.participant), mark });
  };

  return (
    <>
      {inQuiz && question && (
        <>
          <div className={styles.card}>
            <div className={styles.cardLabel}>
              Domanda {index + 1} di {quiz.length} · {total} risposte su {students.length}
            </div>
            <div className={styles.question}>{question.text}</div>

            <div className={styles.answers}>
              {question.options.map((option, i) => (
                <div
                  key={i}
                  className={[styles.answerRow, i === question.correctIndex && styles.answerCorrect]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className={styles.answerLetter}>{LETTERS[i]}</span>
                  <span className={styles.answerText}>{option}</span>
                  <span className={styles.answerBar}>
                    <span
                      className={styles.answerFill}
                      style={{ width: total > 0 ? `${(counts[i] / total) * 100}%` : "0%" }}
                    />
                  </span>
                  <span className={styles.answerCount}>{counts[i]}</span>
                </div>
              ))}
            </div>

            <div className={styles.actions}>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => control({ acceptingAnswers: !session.acceptingAnswers })}
              >
                {session.acceptingAnswers ? "Chiudi risposte" : "Riapri risposte"}
              </Button>
              {index < quiz.length - 1 ? (
                <Button
                  variant="primary"
                  iconRight="next"
                  disabled={busy}
                  onClick={() =>
                    control({ questionIndex: index + 1, acceptingAnswers: true })
                  }
                >
                  Prossima
                </Button>
              ) : (
                <Button
                  variant="primary"
                  disabled={busy}
                  onClick={() => {
                    control({ acceptingAnswers: false });
                    onGrades({});
                  }}
                >
                  Calcola i voti
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      <div className={styles.card}>
        <div className={styles.cardLabel}>Voti</div>
        {grades.length === 0 ? (
          <>
            <div className={styles.cardSub}>
              Il punteggio si calcola dalle risposte registrate. Puoi correggere ogni
              voto prima di pubblicarlo.
            </div>
            <div className={styles.actions}>
              <Button variant="secondary" disabled={busy} onClick={() => onGrades({})}>
                Calcola i voti
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.cardSub} style={{ marginBottom: 12 }}>
              Il voto è già visibile a ciascuno studente. Modificalo per correggerlo.
            </div>
            <div className={styles.people}>
              {grades.map((g) => (
                <div key={String(g.participant)} className={styles.grade}>
                  <div className={styles.gradeBody}>
                    <div className={styles.gradeName}>{g.participantName}</div>
                    <div className={styles.gradeScore}>
                      {g.score} corrette su {g.max}
                    </div>
                  </div>
                  <input
                    className={styles.markInput}
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    defaultValue={g.mark}
                    disabled={busy}
                    aria-label={`Voto di ${g.participantName}`}
                    onBlur={(e) => commitMark(e.target.value, g)}
                    // Su tastiera fisica l'Invio è il gesto naturale per
                    // confermare: senza, il voto si salverebbe solo uscendo
                    // dal campo e un click sbagliato lo perderebbe.
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                  />
                </div>
              ))}
            </div>
            <div className={styles.actions}>
              <Button variant="ghost" disabled={busy} onClick={() => onGrades({})}>
                Ricalcola dalle risposte
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
