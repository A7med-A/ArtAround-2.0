import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { useLiveSession } from "@/context/LiveSessionContext";
import styles from "./QuizPanel.module.css";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/**
 * Quiz finale, dal lato dello studente.
 *
 * La domanda corrente e l'apertura delle risposte le decide il docente:
 * qui si può solo rispondere, una volta sola. L'esito non viene mostrato
 * subito — arriva alla fine, quando il docente pubblica i voti — così una
 * risposta sbagliata non distrae dalla domanda successiva.
 */
export default function QuizPanel() {
  const live = useLiveSession();
  const { session, visit } = live;

  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const quiz = visit?.quiz || [];
  const index = session?.questionIndex ?? 0;
  const question = quiz[index];
  const given = live.answerFor(index);

  const choose = async (choice) => {
    if (given || sending || !session?.acceptingAnswers) return;
    setError(null);
    setSending(true);
    try {
      await live.answer(index, choice);
    } catch (err) {
      setError(err.message || "Risposta non registrata");
    } finally {
      setSending(false);
    }
  };

  if (!question) {
    return (
      <div className={styles.quiz}>
        <div className={[styles.state, styles.stateWaiting].join(" ")}>
          <Icon name="clock" size={18} color="var(--textSec)" />
          Attendi: il tuo insegnante sta preparando le domande.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.quiz}>
      <div className={styles.progress}>
        <span className={styles.progressText}>
          Domanda {index + 1} di {quiz.length}
        </span>
        <span className={styles.dots}>
          {quiz.map((_, i) => (
            <span
              key={i}
              className={[
                styles.dot,
                i === index && styles.dotCurrent,
                i !== index && live.answerFor(i) && styles.dotDone,
              ]
                .filter(Boolean)
                .join(" ")}
            />
          ))}
        </span>
      </div>

      <h2 className={styles.question}>{question.text}</h2>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.options}>
        {question.options.map((option, i) => {
          const picked = given?.choice === i;
          return (
            <button
              key={i}
              type="button"
              className={[styles.option, picked && styles.optionPicked]
                .filter(Boolean)
                .join(" ")}
              onClick={() => choose(i)}
              disabled={Boolean(given) || sending || !session?.acceptingAnswers}
              aria-pressed={picked}
            >
              <span className={styles.letter}>{LETTERS[i]}</span>
              {option}
            </button>
          );
        })}
      </div>

      {given ? (
        <div className={[styles.state, styles.stateDone].join(" ")}>
          <Icon name="check" size={18} color="var(--success)" />
          Risposta inviata. Il risultato lo vedrai alla fine del quiz.
        </div>
      ) : !session?.acceptingAnswers ? (
        <div className={[styles.state, styles.stateWaiting].join(" ")}>
          <Icon name="clock" size={18} color="var(--textSec)" />
          Le risposte non sono ancora aperte: attendi il tuo insegnante.
        </div>
      ) : null}
    </div>
  );
}
