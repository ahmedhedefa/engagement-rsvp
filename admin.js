const adminLogin = document.getElementById("adminLogin");
const adminKey = document.getElementById("adminKey");
const adminMessage = document.getElementById("adminMessage");
const adminContent = document.getElementById("adminContent");
const responseList = document.getElementById("responseList");
const acceptCount = document.getElementById("acceptCount");
const declineCount = document.getElementById("declineCount");
const plusOneCount = document.getElementById("plusOneCount");
const refreshAdmin = document.getElementById("refreshAdmin");

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

    acceptCount.textContent = data.summary.accept;
    declineCount.textContent = data.summary.decline;
    plusOneCount.textContent = data.summary.plusOnes;
    adminContent.hidden = false;
    adminMessage.textContent = "";

    if (!data.rsvps.length) {
      responseList.innerHTML = "<p>No replies yet.</p>";
      return;
    }

    responseList.innerHTML = data.rsvps
      .slice()
      .reverse()
      .map((item) => {
        const status = item.attendance === "accept" ? "Coming" : "Not coming";
        const plusOne = item.plusOne === "yes" ? `Plus one: ${escapeHtml(item.plusOneName || "Yes")}` : "No plus one";
        const diet = item.dietaryRestrictions ? `<p class="note">Dietary: ${escapeHtml(item.dietaryRestrictions)}</p>` : "";
        const note = item.note ? `<p class="note">Note: ${escapeHtml(item.note)}</p>` : "";
        return `
          <article>
            <div>
              <h3>${escapeHtml(item.name)}</h3>
              <p>${escapeHtml(item.email)}</p>
              <p>${escapeHtml(plusOne)}</p>
            </div>
            <p class="status">${status}</p>
            ${diet}
            ${note}
          </article>
        `;
      })
      .join("");
  } catch (error) {
    adminContent.hidden = true;
    adminMessage.textContent = error.message;
  }
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
