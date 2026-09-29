// ═══════════════════════════════════════════════════════════════
// SESSIONS CONTROLLER — visite guidate dal vivo
//
// Due tipi di chiamante, due modi di autenticarsi:
//   • il docente usa il proprio JWT (requireAuth) ed è l'unico a poter
//     cambiare lo stato della sessione;
//   • lo studente usa la streamKey ricevuta all'ingresso, che vale solo
//     per quella sessione e non è una credenziale d'account. Serve perché
//     EventSource non permette di impostare header.
// ═══════════════════════════════════════════════════════════════

const crypto = require("crypto");
const Session = require("../models/Session");
const Visit = require("../models/Visit");
const Item = require("../models/Item");
const hub = require("../live/hub");
const { generateUniqueCode, normalizeCode } = require("../live/sessionCode");

/** Stati in cui la sessione è ancora aperta agli studenti. */
const OPEN_STATES = ["attesa", "in-corso", "quiz"];

// ── Helper ───────────────────────────────────────────────────────

function isOwner(session, user) {
  return user?.role === "admin" || session.teacher === user?.username;
}

async function findByCode(code) {
  return Session.findOne({ code: normalizeCode(code) });
}

/** Ritrova il partecipante da una streamKey. */
function participantByKey(session, key) {
  if (!key) return null;
  return session.participants.find((p) => p.streamKey === key) || null;
}

/** Notifica al docente il cambiamento dell'elenco partecipanti. */
function publishRoster(session) {
  hub.publish(
    session.code,
    "partecipanti",
    {
      participants: session.participants.map((p) => ({
        id: String(p._id),
        name: p.name,
        role: p.role,
        joinedAt: p.joinedAt,
        online: p.online,
      })),
    },
    "docente",
  );
}

/** Propaga lo stato condiviso a tutti i partecipanti. */
function publishState(session) {
  hub.publish(session.code, "stato", session.toStudentView());
}

// ── Docente: gestione delle sessioni ─────────────────────────────

/**
 * POST /api/sessions
 * body: { museumId, visitId }
 * Apre una sessione e ne genera il codice.
 */
async function createSession(req, res) {
  try {
    const { museumId, visitId } = req.body || {};
    if (!museumId || !visitId) {
      return res.status(400).json({ error: "museumId e visitId sono obbligatori" });
    }

    const visit = await Visit.findById(visitId);
    if (!visit) return res.status(404).json({ error: "Visita non trovata" });

    // Chi può condurre: gli amministratori, gli autori del museo, e le
    // docenti — ma solo sulle visite che hanno preparato loro.
    const { role, username } = req.user;
    const canLead =
      role === "admin" ||
      (role === "author" && (req.user.museumSlugs || []).includes(museumId)) ||
      (role === "docente" && visit.createdBy === username);
    if (!canLead) {
      return res
        .status(403)
        .json({ error: "Non hai i permessi per condurre questa visita" });
    }

    if (visit.museumId !== museumId) {
      return res.status(400).json({ error: "La visita non appartiene a questo museo" });
    }
    if ((visit.items || []).length === 0) {
      return res.status(400).json({ error: "La visita non ha ancora tappe" });
    }

    // Unicità su tutte le sessioni: il codice è indicizzato unique, quindi
    // non può essere riassegnato nemmeno dopo che una sessione si è conclusa.
    const { code, label } = await generateUniqueCode(async (candidate) => {
      const existing = await Session.findOne({ code: candidate }).select("_id");
      return Boolean(existing);
    });

    const session = await Session.create({
      code,
      label,
      museumId,
      visitId,
      teacher: req.user.username,
      participants: [
        {
          name: req.user.username,
          role: "docente",
          streamKey: crypto.randomBytes(24).toString("hex"),
          online: false,
        },
      ],
    });

    const teacher = session.participants[0];
    return res.status(201).json({
      session: session.toTeacherView(),
      streamKey: teacher.streamKey,
      participantId: String(teacher._id),
    });
  } catch (err) {
    console.error("[sessions.create]", err);
    return res.status(500).json({ error: err.message || "Errore creazione sessione" });
  }
}

/** GET /api/sessions — sessioni del docente corrente. */
async function listSessions(req, res) {
  try {
    const filter = req.user.role === "admin" ? {} : { teacher: req.user.username };
    if (req.query.museumId) filter.museumId = req.query.museumId;

    const sessions = await Session.find(filter).sort({ createdAt: -1 }).limit(50);
    return res.json(
      sessions.map((s) => ({
        code: s.code,
        label: s.label,
        museumId: s.museumId,
        visitId: s.visitId,
        status: s.status,
        stopIndex: s.stopIndex,
        students: s.participants.filter((p) => p.role === "studente").length,
        createdAt: s.createdAt,
      })),
    );
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/sessions/:code/monitor
 * Quadro completo per il docente: partecipanti, richieste, risposte, voti.
 */
async function monitorSession(req, res) {
  try {
    const session = await findByCode(req.params.code);
    if (!session) return res.status(404).json({ error: "Sessione non trovata" });
    if (!isOwner(session, req.user)) {
      return res.status(403).json({ error: "Non conduci tu questa sessione" });
    }

    const visit = await Visit.findById(session.visitId).populate("items");
    const online = new Set(hub.onlineParticipants(session.code));

    const view = session.toTeacherView();
    view.participants = view.participants.map((p) => ({
      ...p,
      online: online.has(String(p._id)),
    }));

    // Il docente riceve la propria chiave di stream: ricaricando la console
    // deve poter riaprire il canale senza riaprire la sessione.
    const me = session.participants.find((p) => p.role === "docente");

    return res.json({
      session: view,
      visit,
      streamKey: me?.streamKey || null,
      participantId: me ? String(me._id) : null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/sessions/:code
 * body: { status?, stopIndex?, questionIndex?, acceptingAnswers? }
 * Unico punto da cui cambia lo stato condiviso; ogni modifica viene
 * propagata subito a tutti i partecipanti.
 */
async function updateSession(req, res) {
  try {
    const session = await findByCode(req.params.code);
    if (!session) return res.status(404).json({ error: "Sessione non trovata" });
    if (!isOwner(session, req.user)) {
      return res.status(403).json({ error: "Non conduci tu questa sessione" });
    }

    const { status, stopIndex, questionIndex, acceptingAnswers } = req.body || {};

    if (status !== undefined) {
      if (!["attesa", "in-corso", "quiz", "conclusa"].includes(status)) {
        return res.status(400).json({ error: "Stato non valido" });
      }
      if (status === "in-corso" && !session.startedAt) session.startedAt = new Date();
      if (status === "conclusa") {
        session.endedAt = new Date();
        session.acceptingAnswers = false;
      }
      session.status = status;
    }

    if (stopIndex !== undefined) {
      const visit = await Visit.findById(session.visitId);
      const max = Math.max(0, (visit?.items?.length || 1) - 1);
      session.stopIndex = Math.max(0, Math.min(max, Number(stopIndex)));
    }

    if (questionIndex !== undefined) {
      session.questionIndex = Math.max(0, Number(questionIndex));
    }

    if (acceptingAnswers !== undefined) {
      session.acceptingAnswers = Boolean(acceptingAnswers);
    }

    await session.save();
    publishState(session);

    return res.json(session.toTeacherView());
  } catch (err) {
    console.error("[sessions.update]", err);
    return res.status(500).json({ error: err.message });
  }
}

/** DELETE /api/sessions/:code */
async function deleteSession(req, res) {
  try {
    const session = await findByCode(req.params.code);
    if (!session) return res.status(404).json({ error: "Sessione non trovata" });
    if (!isOwner(session, req.user)) {
      return res.status(403).json({ error: "Non conduci tu questa sessione" });
    }
    hub.publish(session.code, "chiusa", { code: session.code });
    await session.deleteOne();
    return res.json({ message: "Sessione eliminata" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// ── Studente: ingresso e partecipazione ──────────────────────────

/**
 * POST /api/sessions/:code/join
 * body: { name }
 * Restituisce la streamKey con cui lo studente seguirà la sessione.
 */
async function joinSession(req, res) {
  try {
    // Il codice si controlla per primo: è la cosa che lo studente digita a
    // orecchio ed è quindi la più probabile fonte di errore. Segnalare prima
    // il nome lo manderebbe a correggere la cosa sbagliata.
    const session = await findByCode(req.params.code);
    if (!session || !OPEN_STATES.includes(session.status)) {
      return res.status(404).json({ error: "Nessuna visita attiva con questo codice" });
    }

    const { name } = req.body || {};
    const cleanName = String(name || "").trim();
    if (cleanName.length < 2) {
      return res.status(400).json({ error: "Inserisci il tuo nome (almeno 2 caratteri)" });
    }

    // Rientro dopo una disconnessione: stesso nome, stessa identità, così la
    // docente non si ritrova la classe raddoppiata e le risposte non si perdono.
    let participant = session.participants.find(
      (p) => p.role === "studente" && p.name.toLowerCase() === cleanName.toLowerCase(),
    );

    if (participant) {
      participant.lastSeenAt = new Date();
    } else {
      session.participants.push({
        name: cleanName,
        role: "studente",
        streamKey: crypto.randomBytes(24).toString("hex"),
      });
      participant = session.participants[session.participants.length - 1];
      session.events.push({
        participant: participant._id,
        participantName: participant.name,
        type: "ingresso",
        stopIndex: session.stopIndex,
      });
    }

    await session.save();
    publishRoster(session);

    const visit = await Visit.findById(session.visitId).populate("items");

    return res.json({
      participantId: String(participant._id),
      streamKey: participant.streamKey,
      session: session.toStudentView(),
      visit,
    });
  } catch (err) {
    console.error("[sessions.join]", err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/sessions/:code/state?key=...
 * Stato corrente. Serve all'avvio e come rete di sicurezza se lo stream
 * si interrompe: lo studente riallinea senza dover rientrare.
 */
async function sessionState(req, res) {
  try {
    const session = await findByCode(req.params.code);
    if (!session) return res.status(404).json({ error: "Sessione non trovata" });

    const participant = participantByKey(session, req.query.key);
    if (!participant) return res.status(401).json({ error: "Chiave non valida" });

    participant.lastSeenAt = new Date();
    await session.save();

    const payload = { session: session.toStudentView() };

    if (participant.role === "studente") {
      payload.myAnswers = session.answers
        .filter((a) => String(a.participant) === String(participant._id))
        .map((a) => ({ questionIndex: a.questionIndex, choice: a.choice }));
      payload.myGrade =
        session.grades.find((g) => String(g.participant) === String(participant._id)) || null;
    }

    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/sessions/:code/stream?key=...
 * Connessione SSE. Resta aperta per tutta la sessione.
 */
async function streamSession(req, res) {
  try {
    const session = await findByCode(req.params.code);
    if (!session) return res.status(404).json({ error: "Sessione non trovata" });

    const participant = participantByKey(session, req.query.key);
    if (!participant) return res.status(401).json({ error: "Chiave non valida" });

    hub.openStream(res);

    // Primo evento: lo stato attuale, così chi si collega parte allineato
    res.write(`event: stato\ndata: ${JSON.stringify(session.toStudentView())}\n\n`);

    const meta = { participantId: String(participant._id), role: participant.role };

    // Il flag `online` è persistito perché il docente possa vedere chi si è
    // collegato anche ricaricando la pagina.
    await Session.updateOne(
      { _id: session._id, "participants._id": participant._id },
      { $set: { "participants.$.online": true, "participants.$.lastSeenAt": new Date() } },
    );
    if (participant.role === "studente") {
      const fresh = await Session.findById(session._id);
      if (fresh) publishRoster(fresh);
    }

    hub.subscribe(session.code, res, meta, async () => {
      await Session.updateOne(
        { _id: session._id, "participants._id": participant._id },
        { $set: { "participants.$.online": false, "participants.$.lastSeenAt": new Date() } },
      );
      if (participant.role === "studente") {
        const fresh = await Session.findById(session._id);
        if (fresh) publishRoster(fresh);
      }
    });
  } catch (err) {
    console.error("[sessions.stream]", err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/sessions/:code/events
 * body: { key, type, value, itemId }
 * Registra una richiesta dello studente (testo più semplice, più esteso,
 * riascolto) e la mostra subito nel monitor del docente.
 */
async function recordEvent(req, res) {
  try {
    const { key, type, value, itemId } = req.body || {};
    const session = await findByCode(req.params.code);
    if (!session) return res.status(404).json({ error: "Sessione non trovata" });

    const participant = participantByKey(session, key);
    if (!participant) return res.status(401).json({ error: "Chiave non valida" });
    if (!["tono", "durata", "riascolto", "uscita"].includes(type)) {
      return res.status(400).json({ error: "Tipo di evento non valido" });
    }

    const event = {
      participant: participant._id,
      participantName: participant.name,
      type,
      value: value ? String(value) : undefined,
      stopIndex: session.stopIndex,
      itemId: itemId || undefined,
      at: new Date(),
    };

    session.events.push(event);
    participant.lastSeenAt = new Date();
    await session.save();

    hub.publish(session.code, "attivita", { event }, "docente");
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error("[sessions.event]", err);
    return res.status(500).json({ error: err.message });
  }
}

// ── Quiz ─────────────────────────────────────────────────────────

/**
 * POST /api/sessions/:code/answers
 * body: { key, questionIndex, choice }
 * La correzione avviene qui: il client non riceve mai l'indice esatto
 * prima di aver risposto.
 */
async function submitAnswer(req, res) {
  try {
    const { key, questionIndex, choice } = req.body || {};
    const session = await findByCode(req.params.code);
    if (!session) return res.status(404).json({ error: "Sessione non trovata" });

    const participant = participantByKey(session, key);
    if (!participant || participant.role !== "studente") {
      return res.status(401).json({ error: "Chiave non valida" });
    }
    if (session.status !== "quiz" || !session.acceptingAnswers) {
      return res.status(409).json({ error: "Le risposte non sono aperte" });
    }
    if (Number(questionIndex) !== session.questionIndex) {
      return res.status(409).json({ error: "Domanda non più attiva" });
    }

    const visit = await Visit.findById(session.visitId);
    const question = visit?.quiz?.[session.questionIndex];
    if (!question) return res.status(404).json({ error: "Domanda non trovata" });

    const picked = Number(choice);
    if (!Number.isInteger(picked) || picked < 0 || picked >= question.options.length) {
      return res.status(400).json({ error: "Risposta non valida" });
    }

    // Una sola risposta per domanda: la prima conta.
    const already = session.answers.some(
      (a) =>
        String(a.participant) === String(participant._id) &&
        a.questionIndex === session.questionIndex,
    );
    if (already) return res.status(409).json({ error: "Hai già risposto a questa domanda" });

    session.answers.push({
      participant: participant._id,
      participantName: participant.name,
      questionIndex: session.questionIndex,
      choice: picked,
      correct: picked === question.correctIndex,
      at: new Date(),
    });
    await session.save();

    hub.publish(
      session.code,
      "risposta",
      {
        questionIndex: session.questionIndex,
        participantId: String(participant._id),
        participantName: participant.name,
        choice: picked,
        correct: picked === question.correctIndex,
      },
      "docente",
    );

    // Allo studente confermiamo la ricezione, non l'esito: il risultato si
    // vede a fine quiz, quando il docente pubblica i voti.
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error("[sessions.answer]", err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/sessions/:code/grades
 * body: { participantId?, mark?, note? }
 * Senza participantId ricalcola i punteggi di tutta la classe; con
 * participantId il docente corregge il voto proposto.
 */
async function setGrades(req, res) {
  try {
    const session = await findByCode(req.params.code);
    if (!session) return res.status(404).json({ error: "Sessione non trovata" });
    if (!isOwner(session, req.user)) {
      return res.status(403).json({ error: "Non conduci tu questa sessione" });
    }

    const visit = await Visit.findById(session.visitId);
    const max = visit?.quiz?.length || 0;
    const { participantId, mark, note } = req.body || {};

    if (participantId) {
      const grade = session.grades.find((g) => String(g.participant) === String(participantId));
      if (!grade) return res.status(404).json({ error: "Voto non ancora calcolato" });
      if (mark !== undefined) grade.mark = Math.max(0, Math.min(10, Number(mark)));
      if (note !== undefined) grade.note = String(note).slice(0, 300);
      grade.at = new Date();
    } else {
      // Ricalcolo di tutta la classe dalle risposte registrate.
      session.grades = session.participants
        .filter((p) => p.role === "studente")
        .map((p) => {
          const own = session.answers.filter(
            (a) => String(a.participant) === String(p._id),
          );
          const score = own.filter((a) => a.correct).length;
          const previous = session.grades.find(
            (g) => String(g.participant) === String(p._id),
          );
          return {
            participant: p._id,
            participantName: p.name,
            score,
            max,
            // Il voto proposto è proporzionale; il docente può correggerlo.
            mark: max > 0 ? Math.round((score / max) * 100) / 10 : 0,
            note: previous?.note,
            at: new Date(),
          };
        });
    }

    await session.save();

    // Ogni voto va soltanto allo studente a cui appartiene: sullo stream
    // dei compagni non deve transitare.
    for (const grade of session.grades) {
      hub.publish(
        session.code,
        "voto",
        {
          score: grade.score,
          max: grade.max,
          mark: grade.mark,
          note: grade.note,
        },
        { participantId: String(grade.participant) },
      );
    }

    return res.json(session.toTeacherView());
  } catch (err) {
    console.error("[sessions.grades]", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createSession,
  listSessions,
  monitorSession,
  updateSession,
  deleteSession,
  joinSession,
  sessionState,
  streamSession,
  recordEvent,
  submitAnswer,
  setGrades,
};
