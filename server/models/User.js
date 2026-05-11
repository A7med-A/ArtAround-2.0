const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-z0-9_-]+$/, "Username: solo lettere minuscole, numeri, _ e -"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Email non valida"],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "author"],
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

// Non serializzare passwordHash quando si fa toJSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
