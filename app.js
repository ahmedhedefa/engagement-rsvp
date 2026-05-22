const envelope = document.getElementById("envelope");
const openInvite = document.getElementById("openInvite");
const scrollCue = document.getElementById("scrollCue");
const form = document.getElementById("rsvpForm");
const message = document.getElementById("formMessage");
const plusOneYes = document.getElementById("plusOneYes");
const plusOneNo = document.getElementById("plusOneNo");
const plusOneDetails = document.getElementById("plusOneDetails");

// ====================================================================
// Envelope reveal sequence
// State machine: closed -> opening -> revealed
//   closed   : sealed envelope, "tap to open" hint pulsing
//   opening  : flap hinges open (3D rotateX), card slides up out of
//              the pocket while still rotated -90deg (sideways)
//   revealed : card rotates upright + scales to focal point,
//              envelope layers fade back
// ====================================================================

// Keep these in sync with the CSS transition timing.
const PHASE_OPENING_MS = 1700; // flap swing + card rise (incl. 450ms delay)
const PHASE_REVEALED_MS = 1300; // card rotate upright + scale

let hasOpened = false;

openInvite.addEventListener("click", () => {
  if (hasOpened) return;
  hasOpened = true;

  // Phase 1: flap hinges open, card begins rising (still sideways)
  envelope.dataset.state = "opening";

  // Phase 2: card rotates upright and scales up to focal point
  setTimeout(() => {
    envelope.dataset.state = "revealed";
  }, PHASE_OPENING_MS);

  // After full reveal: show scroll cue + gently scroll to RSVP
  setTimeout(() => {
    scrollCue.classList.add("is-visible");
  }, PHASE_OPENING_MS + PHASE_REVEALED_MS);

  setTimeout(() => {
    document.getElementById("rsvp").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, PHASE_OPENING_MS + PHASE_REVEALED_MS + 1400);
});

// ====================================================================
// RSVP form
// ====================================================================

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
