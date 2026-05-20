const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = __dirname;
const publicDir = path.join(root, "public");
const dataDir = path.join(root, "data");
const dataFile = path.join(dataDir, "rsvps.json");
const port = process.env.PORT || 3000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon"
};

function ensureStore() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "[]", "utf8");
  }
}

function readRsvps() {
  ensureStore();
  return JSON.parse(fs.readFileSync(dataFile, "utf8") || "[]");
}

function writeRsvps(rsvps) {
  ensureStore();
  fs.writeFileSync(dataFile, JSON.stringify(rsvps, null, 2), "utf8");
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function normalizeRsvp(payload) {
  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim();
  const attendance = String(payload.attendance || "").trim();
  const note = String(payload.note || "").trim();

  if (!name) return { error: "Please enter your full name." };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (!["accept", "decline"].includes(attendance)) {
    return { error: "Please choose whether you will be attending." };
  }

  return {
    rsvp: {
      id: crypto.randomUUID(),
      name,
      email,
      attendance,
      note,
      createdAt: new Date().toISOString()
    }
  };
}

function serveFile(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(publicDir, requestedPath));

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url.startsWith("/api/rsvps")) {
      const rsvps = readRsvps();
      const summary = rsvps.reduce(
        (totals, item) => {
          totals[item.attendance] += 1;
          return totals;
        },
        { accept: 0, decline: 0 }
      );
      sendJson(res, 200, { summary, rsvps });
      return;
    }

    if (req.method === "POST" && req.url.startsWith("/api/rsvps")) {
      const payload = await parseBody(req);
      const result = normalizeRsvp(payload);
      if (result.error) {
        sendJson(res, 400, { error: result.error });
        return;
      }

      const rsvps = readRsvps();
      const existingIndex = rsvps.findIndex((item) => item.email.toLowerCase() === result.rsvp.email.toLowerCase());
      if (existingIndex >= 0) {
        rsvps[existingIndex] = { ...rsvps[existingIndex], ...result.rsvp, id: rsvps[existingIndex].id };
      } else {
        rsvps.push(result.rsvp);
      }
      writeRsvps(rsvps);
      sendJson(res, 201, { ok: true, rsvp: result.rsvp });
      return;
    }

    if (req.method === "GET") {
      serveFile(req, res);
      return;
    }

    res.writeHead(405);
    res.end("Method not allowed");
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Something went wrong." });
  }
});

server.listen(port, () => {
  console.log(`RSVP site running at http://localhost:${port}`);
});
