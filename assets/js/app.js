// Hair Salon — minimal interactivity for the static design demo

// ---------- Review category tabs ----------
document.addEventListener("click", (e) => {
  const tab = e.target.closest(".cat-tab");
  if (!tab) return;
  const group = tab.closest(".cat-tabs");
  if (!group) return;
  group.querySelectorAll(".cat-tab").forEach((t) => t.classList.remove("is-active"));
  tab.classList.add("is-active");

  const filter = tab.dataset.filter;
  document.querySelectorAll("[data-review-designer]").forEach((card) => {
    if (!filter || filter === "all" || card.dataset.reviewDesigner === filter) {
      card.style.display = "";
    } else {
      card.style.display = "none";
    }
  });
});

// ---------- Booking — designer pick ----------
document.addEventListener("click", (e) => {
  const card = e.target.closest("[data-pick]");
  if (!card) return;
  const group = card.dataset.pickGroup;
  document
    .querySelectorAll(`[data-pick-group="${group}"]`)
    .forEach((c) => c.classList.remove("is-selected"));
  card.classList.add("is-selected");

  // update summary panel
  const value = card.dataset.label;
  const target = document.querySelector(`[data-summary="${group}"]`);
  if (target && value) target.textContent = value;

  // price for service
  if (group === "service") {
    const price = card.dataset.price;
    const priceEl = document.querySelector('[data-summary="price"]');
    if (priceEl && price) priceEl.textContent = price;
  }
});

// ---------- Booking — time slot pick ----------
document.addEventListener("click", (e) => {
  const slot = e.target.closest(".time-slot");
  if (!slot || slot.classList.contains("is-disabled")) return;
  document.querySelectorAll(".time-slot").forEach((s) => s.classList.remove("is-selected"));
  slot.classList.add("is-selected");
  const target = document.querySelector('[data-summary="time"]');
  if (target) target.textContent = slot.textContent.trim();
});

// ---------- Booking — calendar day pick ----------
document.addEventListener("click", (e) => {
  const day = e.target.closest(".calendar__day");
  if (!day || day.classList.contains("is-disabled") || day.classList.contains("is-muted")) return;
  document.querySelectorAll(".calendar__day").forEach((d) => d.classList.remove("is-selected"));
  day.classList.add("is-selected");
  const target = document.querySelector('[data-summary="date"]');
  if (target) target.textContent = day.dataset.label || day.textContent.trim();
});
