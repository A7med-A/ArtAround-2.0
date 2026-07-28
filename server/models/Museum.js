const mongoose = require("mongoose");

const cellSchema = new mongoose.Schema(
  {
    x: { type: Number, required: true, min: 0 },
    y: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      enum: ["muro", "item", "uscita", "ingresso", "bagno", "bar"],
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: function () {
        return this.type === "item";
      },
    },
  },
  { _id: false },
);

const floorSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true, min: 0 },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    width: { type: Number, required: true, min: 1, max: 100 },
    height: { type: Number, required: true, min: 1, max: 100 },
    cells: { type: [cellSchema], default: [] },
  },
  { _id: false },
);

const museumSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, "Lo slug può contenere solo lettere minuscole, numeri e trattini"],
    },
    description: { type: String, trim: true, maxlength: 1000 },
    address: { type: String, trim: true, maxlength: 200 },
    createdBy: { type: String, required: true, index: true },
    logoUrl: { type: String },
    coverImageUrl: { type: String },

    floors: { type: [floorSchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Museum", museumSchema);
