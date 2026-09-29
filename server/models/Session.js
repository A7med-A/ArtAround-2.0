// ═══════════════════════════════════════════════════════════════
// SESSION — una visita guidata dal vivo.
//
// Il docente apre una sessione su una propria visita; gli studenti vi
// entrano digitando il codice a sei cifre (es. "428 517"). Da quel
// momento la tappa corrente è decisa dal docente e propagata a tutti
// via SSE: la sessione è l'unica fonte di verità sullo stato condiviso.
//
// Partecipanti, richieste, risposte e voti sono incorporati nel documento:
// una sessione è una classe, quindi qualche decina di partecipanti e
// qualche centinaio di eventi — ampiamente sotto i limiti di un documento
// e comodo da leggere in un colpo solo per il monitoraggio.
// ═══════════════════════════════════════════════════════════════

const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    role: { type: String, enum: ["docente", "studente"], default: "studente" },
    // Credenziale opaca legata alla sola sessione: EventSource non permette
    // header, quindi lo stream si autentica con questa chiave e non con il
    // token dell'account.
    streamKey: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    online: { type: Boolean, default: false },
  },
  { _id: true },
);

const eventSchema = new mongoose.Schema(
  {
    participant: { type: mongoose.Schema.Types.ObjectId, required: true },
    // Nome ripetuto qui: il monitoraggio del docente deve poter elencare
    // "chi ha chiesto cosa" senza risalire ogni volta ai partecipanti.
    participantName: { type: String, required: true },
    type: {
      type: String,
      enum: ["tono", "durata", "riascolto", "ingresso", "uscita"],
      required: true,
    },
    value: { type: String },
    stopIndex: { type: Number, default: 0 },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const answerSchema = new mongoose.Schema(
  {
    participant: { type: mongoose.Schema.Types.ObjectId, required: true },
    participantName: { type: String, required: true },
    questionIndex: { type: Number, required: true, min: 0 },
    choice: { type: Number, required: true, min: 0 },
    correct: { type: Boolean, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const gradeSchema = new mongoose.Schema(
  {
    participant: { type: mongoose.Schema.Types.ObjectId, required: true },
    participantName: { type: String, required: true },
    // Punteggio calcolato dalle risposte
    score: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
    // Voto finale: proposto automaticamente, modificabile dal docente
    mark: { type: Number, min: 0, max: 10 },
    note: { type: String, trim: true, maxlength: 300 },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const sessionSchema = new mongoose.Schema(
  {
    // Codice che gli studenti digitano per entrare: sei cifre, senza
    // separatori. Il vincolo resta permissivo per non invalidare le sessioni
    // archiviate quando il formato dei codici è cambiato.
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, "Il codice può contenere solo lettere minuscole, numeri e trattini"],
    },
    // Forma leggibile mostrata a schermo (es. "428 517")
    label: { type: String, required: true, trim: true, maxlength: 60 },

    museumId: { type: String, required: true, lowercase: true, trim: true, index: true },
    visitId: { type: mongoose.Schema.Types.ObjectId, ref: "Visit", required: true },

    // Username del docente che conduce
    teacher: { type: String, required: true, index: true },

    status: {
      type: String,
      enum: ["attesa", "in-corso", "quiz", "conclusa"],
      default: "attesa",
    },

    // Tappa corrente, decisa dal docente e valida per tutti
    stopIndex: { type: Number, default: 0, min: 0 },

    // Domanda corrente del quiz e se accetta ancora risposte
    questionIndex: { type: Number, default: 0, min: 0 },
    acceptingAnswers: { type: Boolean, default: false },

    participants: { type: [participantSchema], default: [] },
    events: { type: [eventSchema], default: [] },
    answers: { type: [answerSchema], default: [] },
    grades: { type: [gradeSchema], default: [] },

    startedAt: { type: Date },
    endedAt: { type: Date },
  },
  { timestamps: true },
);

/**
 * Vista destinata agli studenti: lo stato condiviso senza i dati degli altri.
 * Non espone streamKey, risposte altrui né voti.
 */
sessionSchema.methods.toStudentView = function toStudentView() {
  return {
    code: this.code,
    label: this.label,
    museumId: this.museumId,
    visitId: this.visitId,
    status: this.status,
    stopIndex: this.stopIndex,
    questionIndex: this.questionIndex,
    acceptingAnswers: this.acceptingAnswers,
    participantCount: this.participants.filter((p) => p.role === "studente").length,
  };
};

/** Vista per il docente: tutto tranne le chiavi di stream. */
sessionSchema.methods.toTeacherView = function toTeacherView() {
  const obj = this.toObject();
  obj.participants = obj.participants.map(({ streamKey, ...rest }) => rest);
  return obj;
};

module.exports = mongoose.model("Session", sessionSchema);
