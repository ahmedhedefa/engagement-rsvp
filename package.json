const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || __dirname;

app.use(express.json({ limit: "1mb" }));

// Serve static files from the app folder.
app.use(express.static(__dirname));

const rsvpFile = path.join(DATA_DIR, "rsvps.json");

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
  return Array.isArray(data) ? data : [];
}

function writeRsvps(rsvps) {
  ensureStorage();
  fs.writeFileSync(rsvpFile, JSON.stringify(rsvps, null, 2));
}

function buildRsvpResponse(rsvps) {
  return {
    summary: {
      accept: rsvps.filter((item) => item.attendance === "accept").length,
      decline: rsvps.filter((item) => item.attendance === "decline").length
    },
    rsvps
  };
}

function saveRsvp(req, res) {
  try {
    const { name, email, attendance, note = "" } = req.body;

    if (!name || !email || !["accept", "decline"].includes(attendance)) {
      return res.status(400).json({ success: false, error: "Please complete the RSVP form." });
    }

    const rsvps = readRsvps();
    const savedRsvp = {
      name: String(name).trim(),
      email: String(email).trim(),
      attendance,
      note: String(note).trim(),
      submittedAt: new Date().toISOString()
    };

    rsvps.push(savedRsvp);
    writeRsvps(rsvps);

    res.status(201).json({ success: true, rsvp: savedRsvp, ...buildRsvpResponse(rsvps) });
  } catch (error) {
    console.error("Error saving RSVP:", error);
    res.status(500).json({ success: false, error: "Could not save RSVP" });
  }
}

// Save RSVP. Keep both routes working so older form code still succeeds.
app.post("/api/rsvps", saveRsvp);
app.post("/api/rsvp", saveRsvp);

// View RSVPs.
app.get("/api/rsvps", (req, res) => {
  try {
    res.json(buildRsvpResponse(readRsvps()));
  } catch (error) {
    console.error("Error reading RSVPs:", error);
    res.status(500).json({ error: "Could not read RSVPs" });
  }
});

// Homepage.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
