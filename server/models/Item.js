const mongoose = require("mongoose");

const textSchema = new mongoose.Schema(
  {
    tone: {
      type: String,
      enum: ["infantile", "semplice", "medio", "avanzato"],
      required: true,
    },
    duration: {
      type: String,
      enum: ["breve", "medio", "lungo"],
      required: true,
    },
    text: { type: String, required: true },
  },
  { _id: false },
);

const itemSchema = new mongoose.Schema(
  {
    // Riferimento al museo tramite slug (stesso pattern di Visit)
    museumId: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, "museumId deve essere uno slug valido"],
      index: true,
    },

    title: { type: String, required: true, trim: true, maxlength: 120 },
    artist: { type: String, required: true, trim: true, maxlength: 120 },
    period: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, required: true, maxlength: 2000 },
    imageUrl: { type: String },

    license: {
      type: String,
      enum: ["CC-BY", "CC-BY-SA", "CC0", "privata"],
      required: true,
    },

    tags: [{ type: String, trim: true, lowercase: true }],

    // Ownership stretta
    createdBy: {
      type: String,
      required: true,
      index: true,
    },

    published: { type: Boolean, default: false, index: true },

    texts: {
      type: [textSchema],
      // Ci penso dopo
      //validate: {
      //  validator: (arr) => arr.length > 0,
      //  message: "Un Item deve avere almeno un testo",
      //},
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Item", itemSchema);
