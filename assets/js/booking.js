// booking.js — designer / service / day / time selection
// keeps the right-rail summary (and mobile bottom bar) in sync
(function () {
  // ---------- Pick groups (designer / service) ----------
  document.addEventListener("click", (e) => {
    const card = e.target.closest("[data-pick]");
    if (!card) return;
    const group = card.dataset.pickGroup;

    document
      .querySelectorAll(`[data-pick-group="${group}"]`)
      .forEach((c) => c.classList.remove("is-selected"));
    card.classList.add("is-selected");

    setSummary(group, card.dataset.label);

    if (group === "service") {
      setSummary("price", card.dataset.price);
    }
  });

  // ---------- Time slot ----------
  document.addEventListener("click", (e) => {
    const slot = e.target.closest(".time-slot");
    if (!slot || slot.classList.contains("is-disabled")) return;
    document.querySelectorAll(".time-slot").forEach((s) => s.classList.remove("is-selected"));
    slot.classList.add("is-selected");
    setSummary("time", slot.textContent.trim());
  });

  // ---------- Calendar day ----------
  document.addEventListener("click", (e) => {
    const day = e.target.closest(".calendar__day");
    if (!day) return;
    if (day.classList.contains("is-disabled") || day.classList.contains("is-muted")) return;
    document.querySelectorAll(".calendar__day").forEach((d) => d.classList.remove("is-selected"));
    day.classList.add("is-selected");
    setSummary("date", day.dataset.label || day.textContent.trim());
  });

  // ---------- Helpers ----------
  function setSummary(key, value) {
    if (!value) return;
    document
      .querySelectorAll(`[data-summary="${key}"]`)
      .forEach((el) => (el.textContent = value));
  }
})();
