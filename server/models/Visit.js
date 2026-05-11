const mongoose = require("mongoose");

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
  },
  { timestamps: true },
);


module.exports = mongoose.model("Visit", visitSchema);
