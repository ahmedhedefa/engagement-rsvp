const envelopeScene = document.getElementById("envelopeScene");
const openInvite = document.getElementById("openInvite");
const scrollCue = document.getElementById("scrollCue");
const form = document.getElementById("rsvpForm");
const message = document.getElementById("formMessage");
const responseList = document.getElementById("responseList");
const acceptCount = document.getElementById("acceptCount");
const declineCount = document.getElementById("declineCount");
const refreshAdmin = document.getElementById("refreshAdmin");

openInvite.addEventListener("click", () => {
  envelopeScene.classList.add("is-open");
  scrollCue.classList.add("is-visible");
  setTimeout(() => {
    document.getElementById("rsvp").scrollIntoView({ behavior: "smooth", block: "start" });
  }, 1450);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "Sending...";

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch("/api/rsvps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to send your RSVP.");
    }

    form.reset();
    message.textContent = "Thank you. Your reply has been saved.";
    loadAdmin();
  } catch (error) {
    message.textContent = error.message;
  }
});

refreshAdmin.addEventListener("click", loadAdmin);

async function loadAdmin() {
  const response = await fetch("/api/rsvps");
  const data = await response.json();

  acceptCount.textContent = data.summary.accept;
  declineCount.textContent = data.summary.decline;

  if (!data.rsvps.length) {
    responseList.innerHTML = "<p>No replies yet.</p>";
    return;
  }

  responseList.innerHTML = data.rsvps
    .slice()
    .reverse()
    .map((item) => {
      const status = item.attendance === "accept" ? "Coming" : "Not coming";
      const note = item.note ? `<p class="note">${escapeHtml(item.note)}</p>` : "";
      return `
        <article>
          <div>
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(item.email)}</p>
          </div>
          <p class="status">${status}</p>
          ${note}
        </article>
      `;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character];
  });
}

loadAdmin();
