const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // Password in chiaro: scelta di semplificazione del progetto didattico.
    // In un sistema reale qui andrebbe un hash (bcrypt o simili), perché
    // chiunque legga il database vedrebbe altrimenti tutte le password.
    password: {
      type: String,
      required: true,
    },
    // admin   → gestisce musei e utenti
    // author  → cura i contenuti dei musei a cui ha accesso
    // docente → prepara visite per la propria classe: non tocca musei,
    //           mappe né opere altrui, e ciò che crea resta privato
    // visitor → consulta e basta
    role: {
      type: String,
      enum: ["admin", "author", "docente", "visitor"],
      default: "author",
      required: true,
    },
    // Slug dei musei a cui un autore ha accesso. L'admin gestisce questo array.
    // Per gli admin il campo è ignorato (hanno accesso a tutto).
    museumSlugs: {
      type: [String],
      default: [],
      set: (arr) => Array.from(new Set((arr || []).map((s) => String(s).toLowerCase().trim()).filter(Boolean))),
    },
  },
  { timestamps: true },
);

// La password non esce mai dalle risposte dell'API
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
