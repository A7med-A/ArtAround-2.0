const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("./db");

const app = express();

app.use(express.json());

// routes
app.use("/api/museums", require("./routes/museums.routes"));

const PORT = process.env.PORT || 3002;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
