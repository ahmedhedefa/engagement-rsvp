const envelopeScene = document.getElementById("envelopeScene");
const openInvite = document.getElementById("openInvite");
const scrollCue = document.getElementById("scrollCue");
const form = document.getElementById("rsvpForm");
const message = document.getElementById("formMessage");
const plusOneYes = document.getElementById("plusOneYes");
const plusOneNo = document.getElementById("plusOneNo");
const plusOneDetails = document.getElementById("plusOneDetails");

openInvite.addEventListener("click", () => {
  envelopeScene.classList.add("is-open");
  scrollCue.classList.add("is-visible");
  setTimeout(() => {
    document.getElementById("rsvp").scrollIntoView({ behavior: "smooth", block: "start" });
  }, 1450);
});

function updatePlusOneDetails() {
  const isVisible = plusOneYes.checked;
  plusOneDetails.hidden = !isVisible;
  plusOneDetails.querySelector("input").required = isVisible;

  if (!isVisible) {
    plusOneDetails.querySelector("input").value = "";
  }
}

plusOneYes.addEventListener("change", updatePlusOneDetails);
plusOneNo.addEventListener("change", updatePlusOneDetails);
updatePlusOneDetails();

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
    updatePlusOneDetails();
    message.textContent = "Thank you. Your reply has been saved.";
  } catch (error) {
    message.textContent = error.message;
  }
});
