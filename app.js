const envelope = document.getElementById("envelope");
const openInvite = document.getElementById("openInvite");
const scrollCue = document.getElementById("scrollCue");
const form = document.getElementById("rsvpForm");
const message = document.getElementById("formMessage");
const plusOneYes = document.getElementById("plusOneYes");
const plusOneNo = document.getElementById("plusOneNo");
const plusOneDetails = document.getElementById("plusOneDetails");

// Remove the .preload class once the page has painted its first
// frame. While .preload is present, all envelope transitions are
// disabled (see styles.css), so the flap appears in its resting
// position instantly instead of animating into place on load.
// A double requestAnimationFrame guarantees the initial styles
// have been applied and painted before transitions are enabled.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    envelope.classList.remove("preload");
  });
});

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
// Card rise = 450ms delay + 1150ms (--t-card-rise) = finishes at 1600ms.
// Rise = 450ms delay + 1150ms (--t-card-rise) = settles at 1600ms.
// But --ease-paper decelerates hard at the end, so the card nearly
// stalls in its last ~250ms. Starting the rotate 250ms BEFORE the
// rise fully settles overlaps the two moves and removes that stall.
const PHASE_OPENING_MS = 1350; // rotate picks up while rise is still easing out
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

  // After the reveal, give the guest a long, unhurried moment to
  // look at the card before the RSVP cue appears. No auto-scroll —
  // the guest scrolls themselves, or clicks the cue button.
  setTimeout(() => {
    scrollCue.classList.add("is-visible");
  }, PHASE_OPENING_MS + PHASE_REVEALED_MS + 2000);
});

// Clicking the cue button smoothly scrolls down to the RSVP form.
scrollCue.addEventListener("click", () => {
  document.getElementById("rsvp").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
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
