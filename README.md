# Ahmed & Christine RSVP Site

Local RSVP website with an animated invitation reveal, RSVP form, and JSON-backed response tracking.

## Run

```powershell
& 'C:\Users\hedef\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' server.js
```

Then open:

```text
http://localhost:3000
```

## RSVP Data

Responses are stored in:

```text
data/rsvps.json
```

The app also exposes:

```text
GET  /api/rsvps
POST /api/rsvps
```
