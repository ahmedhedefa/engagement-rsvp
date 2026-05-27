const adminLogin = document.getElementById("adminLogin");
const adminKey = document.getElementById("adminKey");
const adminMessage = document.getElementById("adminMessage");
const adminContent = document.getElementById("adminContent");
const responseList = document.getElementById("responseList");
const acceptCount = document.getElementById("acceptCount");
const declineCount = document.getElementById("declineCount");
const plusOneCount = document.getElementById("plusOneCount");
const refreshAdmin = document.getElementById("refreshAdmin");
const downloadCsv = document.getElementById("downloadCsv");

let currentAdminKey = sessionStorage.getItem("rsvpAdminKey") || "";

if (currentAdminKey) {
  adminKey.value = currentAdminKey;
  loadAdmin();
}

adminLogin.addEventListener("submit", (event) => {
  event.preventDefault();
  currentAdminKey = adminKey.value.trim();
  sessionStorage.setItem("rsvpAdminKey", currentAdminKey);
  loadAdmin();
});

refreshAdmin.addEventListener("click", loadAdmin);

if (downloadCsv) {
  downloadCsv.addEventListener("click", downloadGuestCsv);
}

responseList.addEventListener("click", async (event) => {
  const deleteButton = event.target.closest("[data-delete-id]");

  if (!deleteButton) return;

  const id = deleteButton.dataset.deleteId;
  const guestName = deleteButton.dataset.guestName || "this response";

  const shouldDelete = window.confirm(`Delete ${guestName}? This cannot be undone.`);

  if (!shouldDelete) return;

  await deleteRsvp(id);
});

async function loadAdmin() {
  if (!currentAdminKey) {
    adminMessage.textContent = "Enter your admin key.";
    return;
  }

  adminMessage.textContent = "Loading...";

  try {
    const response = await fetch("/api/rsvps", {
      headers: { "x-admin-key": currentAdminKey }
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to load RSVPs.");
    }

    renderAdmin(data);
    adminMessage.textContent = "";
  } catch (error) {
    adminContent.hidden = true;
    adminMessage.textContent = error.message;
  }
}

function renderAdmin(data) {
  acceptCount.textContent = data.summary.accept;
  declineCount.textContent = data.summary.decline;
  plusOneCount.textContent = data.summary.plusOnes;
  adminContent.hidden = false;

  if (!data.rsvps.length) {
    responseList.innerHTML = "<p class=\"empty-admin\">No replies yet.</p>";
    return;
  }

  responseList.innerHTML = data.rsvps
    .slice()
    .reverse()
    .map((item) => {
      const status = item.attendance === "accept" ? "Coming" : "Not coming";
      const statusClass = item.attendance === "accept" ? "status--accept" : "status--decline";
      const plusOne = item.plusOne === "yes"
        ? `Plus one: ${escapeHtml(item.plusOneName || "Yes")}`
        : "No plus one";
      const email = item.email ? `<p class=\"response-email\">${escapeHtml(item.email)}</p>` : "";
      const diet = item.dietaryRestrictions
        ? `<p class=\"note\"><strong>Dietary:</strong> ${escapeHtml(item.dietaryRestrictions)}</p>`
        : "";
      const note = item.note
        ? `<p class=\"note\"><strong>Note:</strong> ${escapeHtml(item.note)}</p>`
        : "";
      const submittedAt = item.submittedAt
        ? `<p class=\"submitted-at\">${formatDate(item.submittedAt)}</p>`
        : "";

      return `
        <article class="response-card">
          <div class="response-card__main">
            <h3>${escapeHtml(item.name)}</h3>
            ${email}
            <p>${escapeHtml(plusOne)}</p>
            ${submittedAt}
          </div>

          <div class="response-card__side">
            <p class="status ${statusClass}">${status}</p>
            <button
              class="delete-response"
              type="button"
              data-delete-id="${escapeAttribute(item.id)}"
              data-guest-name="${escapeAttribute(item.name)}"
            >
              Delete
            </button>
          </div>

          ${diet}
          ${note}
        </article>
      `;
    })
    .join("");
}

async function deleteRsvp(id) {
  if (!currentAdminKey) {
    adminMessage.textContent = "Enter your admin key.";
    return;
  }

  adminMessage.textContent = "Deleting...";

  try {
    const response = await fetch(`/api/rsvps/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "x-admin-key": currentAdminKey }
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to delete RSVP.");
    }

    renderAdmin(data);
    adminMessage.textContent = "Response deleted.";
  } catch (error) {
    adminMessage.textContent = error.message;
  }
}

async function downloadGuestCsv() {
  if (!currentAdminKey) {
    adminMessage.textContent = "Enter your admin key.";
    return;
  }

  adminMessage.textContent = "Preparing download...";

  try {
    const response = await fetch("/api/rsvps/export.csv", {
      headers: { "x-admin-key": currentAdminKey }
    });

    if (!response.ok) {
      let errorMessage = "Unable to download guest list.";

      try {
        const data = await response.json();
        errorMessage = data.error || errorMessage;
      } catch (_) {
        // Response was not JSON. Keep the default message.
      }

      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "rsvp-guest-list.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    adminMessage.textContent = "Guest list downloaded.";
  } catch (error) {
    adminMessage.textContent = error.message;
  }
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
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

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
