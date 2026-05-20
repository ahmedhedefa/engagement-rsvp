const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve your files from the main folder
app.use(express.static(__dirname));

const rsvpFile = path.join(__dirname, "rsvps.json");

if (!fs.existsSync(rsvpFile)) {
  fs.writeFileSync(rsvpFile, "[]");
}

// Save RSVP
app.post("/api/rsvp", (req, res) => {
  try {
    const rsvps = JSON.parse(fs.readFileSync(rsvpFile, "utf8"));

    rsvps.push({
      ...req.body,
      submittedAt: new Date().toISOString()
    });

    fs.writeFileSync(rsvpFile, JSON.stringify(rsvps, null, 2));

    res.json({ success: true });
  } catch (error) {
    console.error("Error saving RSVP:", error);
    res.status(500).json({ success: false, error: "Could not save RSVP" });
  }
});

// View RSVPs
app.get("/api/rsvps", (req, res) => {
  try {
    const rsvps = JSON.parse(fs.readFileSync(rsvpFile, "utf8"));
    res.json(rsvps);
  } catch (error) {
    res.status(500).json({ error: "Could not read RSVPs" });
  }
});

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
