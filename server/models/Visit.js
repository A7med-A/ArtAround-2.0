const mongoose = require("mongoose");

// ── Quiz a scelta multipla ──────────────────────────────────────
// Le domande vivono sulla visita: sono pensate su quel percorso e su
// quelle opere, e non avrebbero senso staccate da esso.
const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 300 },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length >= 2 && arr.length <= 6,
        message: "Una domanda deve avere da 2 a 6 risposte",
      },
    },
    correctIndex: { type: Number, required: true, min: 0 },
    // Opera a cui la domanda si riferisce (facoltativa)
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
  },
  { _id: false },
);

const visitSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    // Riferimento al museo tramite slug (stesso pattern di Item)
    museumId: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, "museumId deve essere uno slug valido"],
      index: true,
    },

    // Ownership stretta
    createdBy: {
      type: String,
      required: true,
      index: true,
    },

    // Sequenza ordinata di item (l'ordine dell'array = ordine delle tappe)
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
      },
    ],

    // Modalità di fruizione. Non è una scelta: discende dal ruolo di chi
    // crea la visita, ed è il server a imporla.
    //   libera   → admin e autori: il visitatore avanza da solo
    //   guidata  → docenti: conducono la classe, gli studenti seguono in
    //              sincronia e non possono spostarsi fra le tappe da soli
    mode: {
      type: String,
      enum: ["libera", "guidata"],
      default: "libera",
    },

    // Visibilità del percorso.
    //   pubblica → compare fra le visite del museo (comportamento storico)
    //   privata  → la vede solo chi l'ha creata. Le visite preparate da un
    //              docente per la propria classe sono sempre private: non
    //              sono contenuto del museo e non riguardano gli altri autori.
    visibility: {
      type: String,
      enum: ["pubblica", "privata"],
      default: "pubblica",
      index: true,
    },

    // Quiz finale, usato solo dalle visite guidate
    quiz: { type: [questionSchema], default: [] },
  },
  { timestamps: true },
);


module.exports = mongoose.model("Visit", visitSchema);
