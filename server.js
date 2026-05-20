const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || __dirname;
const ADMIN_KEY = process.env.ADMIN_KEY || "";

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

const rsvpFile = path.join(DATA_DIR, "rsvps.json");

function makeId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(rsvpFile)) {
    fs.writeFileSync(rsvpFile, "[]");
  }
}

function readRsvps() {
  ensureStorage();

  const data = JSON.parse(fs.readFileSync(rsvpFile, "utf8"));
  const rsvps = Array.isArray(data) ? data : [];

  let changed = false;

  const normalizedRsvps = rsvps.map((item) => {
    if (!item.id) {
      changed = true;
      return {
        ...item,
        id: makeId()
      };
    }

    return item;
  });

  if (changed) {
    fs.writeFileSync(rsvpFile, JSON.stringify(normalizedRsvps, null, 2));
  }

  return normalizedRsvps;
}

function writeRsvps(rsvps) {
  ensureStorage();
  fs.writeFileSync(rsvpFile, JSON.stringify(rsvps, null, 2));
}

function buildRsvpResponse(rsvps) {
  return {
    summary: {
      accept: rsvps.filter((item) => item.attendance === "accept").length,
      decline: rsvps.filter((item) => item.attendance === "decline").length,
      plusOnes: rsvps.filter((item) => item.plusOne === "yes").length
    },
    rsvps
  };
}

function isAdminRequest(req) {
  return Boolean(ADMIN_KEY) && req.get("x-admin-key") === ADMIN_KEY;
}

function requireAdmin(req, res) {
  if (!isAdminRequest(req)) {
    res.status(401).json({ error: "Admin access required" });
    return false;
  }

  return true;
}

function saveRsvp(req, res) {
  try {
    const {
      name,
      email,
      attendance,
      plusOne = "no",
      plusOneName = "",
      dietaryRestrictions = "",
      note = ""
    } = req.body;

    if (!name || !email || !["accept", "decline"].includes(attendance)) {
      return res.status(400).json({
        success: false,
        error: "Please complete the RSVP form."
      });
    }

    if (!["yes", "no"].includes(plusOne)) {
      return res.status(400).json({
        success: false,
        error: "Please choose a plus-one option."
      });
    }

    const rsvps = readRsvps();

    const savedRsvp = {
      id: makeId(),
      name: String(name).trim(),
      email: String(email).trim(),
      attendance,
      plusOne,
      plusOneName: String(plusOneName).trim(),
      dietaryRestrictions: String(dietaryRestrictions).trim(),
      note: String(note).trim(),
      submittedAt: new Date().toISOString()
    };

    rsvps.push(savedRsvp);
    writeRsvps(rsvps);

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error saving RSVP:", error);
    res.status(500).json({ success: false, error: "Could not save RSVP" });
  }
}

app.post("/api/rsvps", saveRsvp);
app.post("/api/rsvp", saveRsvp);

app.get("/api/rsvps", (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    res.json(buildRsvpResponse(readRsvps()));
  } catch (error) {
    console.error("Error reading RSVPs:", error);
    res.status(500).json({ error: "Could not read RSVPs" });
  }
});

app.delete("/api/rsvps/:id", (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const { id } = req.params;
    const rsvps = readRsvps();

    const updatedRsvps = rsvps.filter((item) => item.id !== id);

    if (updatedRsvps.length === rsvps.length) {
      return res.status(404).json({
        success: false,
        error: "RSVP not found"
      });
    }

    writeRsvps(updatedRsvps);

    res.json({
      success: true,
      message: "RSVP deleted",
      ...buildRsvpResponse(updatedRsvps)
    });
  } catch (error) {
    console.error("Error deleting RSVP:", error);
    res.status(500).json({ error: "Could not delete RSVP" });
  }
});

app.delete("/api/rsvps", (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    writeRsvps([]);

    res.json({
      success: true,
      message: "All RSVP responses deleted",
      summary: {
        accept: 0,
        decline: 0,
        plusOnes: 0
      },
      rsvps: []
    });
  } catch (error) {
    console.error("Error clearing RSVPs:", error);
    res.status(500).json({ error: "Could not clear RSVPs" });
  }
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
