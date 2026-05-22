const revealScene = document.getElementById("revealScene");
const openInvite = document.getElementById("openInvite");
const scrollCue = document.getElementById("scrollCue");
const form = document.getElementById("rsvpForm");
const message = document.getElementById("formMessage");
const plusOneYes = document.getElementById("plusOneYes");
const plusOneNo = document.getElementById("plusOneNo");
const plusOneDetails = document.getElementById("plusOneDetails");

// ====================================================================
// Envelope reveal sequence
// State machine: closed -> flap-opening -> opening -> revealed
//   closed       : sealed envelope, "tap to open" hint pulsing
//   flap-opening : flap just barely lifted (intermediate frame, ~350ms)
//   opening      : flap fully open, card slides up out of pocket
//                  (still rotated -90deg / sideways)
//   revealed     : card rotates upright + scales to focal point,
//                  envelope & front pocket fade back
// ====================================================================

// Phase durations - keep in sync with CSS transitions on the layers.
const PHASE_FLAP_LIFT_MS = 400;  // closed -> slightly-open crossfade
const PHASE_OPENING_MS = 1600;   // slightly-open -> open + card rise
const PHASE_REVEALED_MS = 1300;  // card rotates upright + scales up

let hasOpened = false;

openInvite.addEventListener("click", () => {
  if (hasOpened) return;
  hasOpened = true;

  // Phase 1: flap just barely lifts (closed -> slightly-open)
  revealScene.dataset.state = "flap-opening";

  // Phase 2: flap fully opens + card begins to rise (still sideways)
  setTimeout(() => {
    revealScene.dataset.state = "opening";
  }, PHASE_FLAP_LIFT_MS);

  // Phase 3: card rotates upright and scales up to focal point
  setTimeout(() => {
    revealScene.dataset.state = "revealed";
  }, PHASE_FLAP_LIFT_MS + PHASE_OPENING_MS);

  // After full reveal: show scroll cue + gently scroll to RSVP
  setTimeout(() => {
    scrollCue.classList.add("is-visible");
  }, PHASE_FLAP_LIFT_MS + PHASE_OPENING_MS + PHASE_REVEALED_MS);

  setTimeout(() => {
    document.getElementById("rsvp").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, PHASE_FLAP_LIFT_MS + PHASE_OPENING_MS + PHASE_REVEALED_MS + 1400);
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
