require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Expense = require("./models/Expense");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const fs = require("fs");

async function connectDB() {
  try {
    let uri = process.env.MONGO_URI;
    if (process.env.USE_BUILTIN_DB === "true") {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      fs.mkdirSync("./data", { recursive: true });
      const mongod = await MongoMemoryServer.create({
        instance: { dbPath: "./data", storageEngine: "wiredTiger", port: 27018 },
      });
      uri = mongod.getUri() + "expensestracker";
    }
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.log("❌ MongoDB error:", err.message);
  }
}
connectDB();

// View history (newest first)
app.get("/api/expenses", async (req, res) => {
  res.json(await Expense.find().sort({ date: -1, _id: -1 }));
});

// Add expense
app.post("/api/expenses", async (req, res) => {
  try { res.status(201).json(await Expense.create(req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

// Edit expense
app.put("/api/expenses/:id", async (req, res) => {
  try {
    const doc = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Delete expense
app.delete("/api/expenses/:id", async (req, res) => {
  await Expense.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

app.listen(process.env.PORT || 5000, () =>
  console.log(`🚀 Open http://localhost:${process.env.PORT || 5000}`));
