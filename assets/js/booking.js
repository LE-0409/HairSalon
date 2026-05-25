/* ===============================================================
   booking.js — 5-step booking flow
   - Pick group selection (designer / service) + price sync
   - Calendar: month nav, day selection, "today" indicator
   - Time slots: AM/PM grouping label + selection
   - Textarea char counter + phone formatting/validation
   - Stepper updates as fields fill
   - Sticky summary card highlight on selection
   - Confirmation modal on "예약 확정"
   =============================================================== */
(function () {
  "use strict";

  /* ---------- Catalog ----------
     Built from ServiceStore / DesignerStore so admin edits flow through.
     `minutes` is in multiples of 30 to line up with the time-slot grid. */
  const SERVICES = {};
  (window.ServiceStore ? ServiceStore.list() : []).forEach((s) => {
    SERVICES[s.id] = {
      label: s.name,
      price: ServiceStore.formatPrice(s.price),
      desc: s.desc,
      minutes: s.minutes,
      tone: s.tone,
      photo: s.photo || null,
    };
  });
  const durationText = (m) => `약 ${m}분`;

  const DESIGNERS = {};
  (window.DesignerStore ? DesignerStore.list() : []).forEach((d) => {
    DESIGNERS[d.id] = {
      label: `${d.name} (${d.role}·${d.years}년차)`,
      short: `${d.name} ${d.role}`,
      services: d.services || [],
      tone: d.tone,
      photo: d.photo || null,
      initial: d.initial,
      name: d.name,
      role: d.role,
      years: d.years,
    };
  });

  // Render the designer pick row from the store. The rest of the booking
  // flow only cares about [data-pick][data-designer-id] markers.
  (function renderDesignerPicks() {
    const row = document.getElementById("designer-pick-row");
    if (!row) return;
    const escapeHtml = (s) => String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    row.innerHTML = Object.entries(DESIGNERS).map(([id, d]) => {
      const photoStyle = d.photo
        ? ` style="background-image:url('${escapeHtml(d.photo)}'); background-size:cover; background-position:center;"`
        : "";
      const initial = d.photo ? "" : `<span class="designer-card__initial">${escapeHtml(d.initial)}</span>`;
      return `
        <div class="pick-card" data-pick data-pick-group="designer" data-designer-id="${escapeHtml(id)}" data-label="${escapeHtml(d.label)}">
          <div class="pick-card__photo" data-tone="${escapeHtml(d.tone)}"${photoStyle}>${initial}</div>
          <h4>${escapeHtml(d.name)}</h4>
          <p>${escapeHtml(d.role)} · ${escapeHtml(d.years)}년차</p>
        </div>`;
    }).join("");
  })();

  const EMPTY = "—";
  const state = {
    designerId: null,
    designer: "",
    serviceId: null,
    service: "",
    price: "",
    date: "",
    time: "",
  };

  /* ---------- Helpers ---------- */
  function setSummary(key, value) {
    state[key] = value == null ? "" : value;
    const display = state[key] === "" ? EMPTY : state[key];
    document.querySelectorAll(`[data-summary="${key}"]`).forEach((el) => {
      el.textContent = display;
      el.classList.remove("flash");
      void el.offsetWidth;
      if (state[key] !== "") el.classList.add("flash");
    });
  }

  function updateStepper() {
    const items = document.querySelectorAll(".stepper__item");
    if (!items.length) return;
    // Step 1 (kakao) presumed done; mark 2/3/4 active based on filled state.
    const filled = [true, !!state.designer, !!state.service, !!(state.date && state.time)];
    items.forEach((item, i) => {
      if (i === 0) {
        item.classList.add("is-done");
        item.classList.remove("is-active");
      } else if (i < 4) {
        item.classList.toggle("is-active", filled[i]);
        item.classList.toggle("is-done", filled[i]);
      } else {
        // Final step active only if all prior filled
        const allReady = filled.every(Boolean);
        item.classList.toggle("is-active", allReady);
      }
    });
  }

  /* ---------- Time-slot availability ----------
     A slot is bookable only if it + the next (duration/30 − 1) slots are
     all unbooked. Snapshot the initial booked state once via data-booked so
     we can re-evaluate when the selected service (and its duration) changes. */
  const allSlots = [...document.querySelectorAll(".time-slot")];
  allSlots.forEach((s) => {
    if (s.classList.contains("is-disabled")) s.dataset.booked = "true";
  });

  function updateTimeAvailability() {
    if (!allSlots.length) return;
    const service = state.serviceId ? SERVICES[state.serviceId] : null;
    const needed = service ? service.minutes / 30 : 1;

    allSlots.forEach((slot, i) => {
      if (slot.dataset.booked === "true") {
        slot.classList.add("is-disabled");
        return;
      }
      if (!service) {
        slot.classList.remove("is-disabled");
        return;
      }
      let canFit = true;
      for (let k = 0; k < needed; k++) {
        const nxt = allSlots[i + k];
        if (!nxt || nxt.dataset.booked === "true") {
          canFit = false;
          break;
        }
      }
      slot.classList.toggle("is-disabled", !canFit);
    });

    // If the currently-selected slot just became disabled, clear it.
    const sel = document.querySelector(".time-slot.is-selected");
    if (sel && sel.classList.contains("is-disabled")) {
      sel.classList.remove("is-selected");
      setSummary("time", "");
      if (window.toast)
        window.toast("선택한 시간은 이 시술 길이에 맞지 않아 해제되었어요", {
          variant: "error",
          duration: 2400,
        });
    }
  }

  /* ---------- Reset helpers ---------- */
  function clearDateTime() {
    document
      .querySelectorAll(".calendar__day.is-selected")
      .forEach((d) => d.classList.remove("is-selected"));
    document
      .querySelectorAll(".time-slot.is-selected")
      .forEach((s) => s.classList.remove("is-selected"));
    setSummary("date", "");
    setSummary("time", "");
  }

  /* ---------- Service list rendering ---------- */
  const serviceListEl = document.querySelector("[data-service-list]");
  const serviceLedeEl = document.querySelector("[data-service-lede]");

  function renderServiceList(designerId) {
    if (!serviceListEl) return;

    // Always reset prior service selection — designer change wipes it.
    state.serviceId = null;
    setSummary("service", "");
    setSummary("price", "");
    setSummary("duration", "");
    updateTimeAvailability();

    const designer = DESIGNERS[designerId];
    if (!designer) {
      serviceListEl.innerHTML =
        '<div class="service-empty">디자이너를 먼저 선택해주세요.</div>';
      if (serviceLedeEl) serviceLedeEl.textContent = "디자이너를 먼저 선택해주세요.";
      return;
    }

    serviceListEl.innerHTML = designer.services
      .map((sid) => {
        const s = SERVICES[sid];
        if (!s) return "";
        const photoStyle = s.photo
          ? ` style="background-image:url('${s.photo}'); background-size:cover; background-position:center;"`
          : "";
        return `
          <div class="service-row" data-pick data-pick-group="service" data-service-id="${sid}" data-label="${s.label}" data-price="${s.price}">
            <div class="service-row__photo" data-tone="${s.tone}"${photoStyle}></div>
            <div class="service-row__main">
              <div class="service-row__title">
                <span>${s.label}</span>
                <span class="service-row__price">${s.price}</span>
              </div>
              <div class="service-row__desc">${s.desc}</div>
              <div class="service-row__time">⏱ ${durationText(s.minutes)}</div>
            </div>
          </div>`;
      })
      .join("");

    if (serviceLedeEl) {
      serviceLedeEl.innerHTML = `<strong>${designer.short}</strong>가 가능한 시술 중 하나를 골라주세요.`;
    }
  }

  /* ---------- Pick groups (designer / service) ---------- */
  document.addEventListener("click", (e) => {
    const card = e.target.closest("[data-pick]");
    if (!card) return;
    const group = card.dataset.pickGroup;
    if (!group) return;

    document
      .querySelectorAll(`[data-pick-group="${group}"]`)
      .forEach((c) => c.classList.remove("is-selected"));
    card.classList.add("is-selected");

    setSummary(group, card.dataset.label);
    if (group === "designer") {
      const id = card.dataset.designerId;
      if (id && DESIGNERS[id]) {
        state.designerId = id;
        renderServiceList(id);
        clearDateTime();
      }
    } else if (group === "service") {
      if (card.dataset.serviceId) state.serviceId = card.dataset.serviceId;
      if (card.dataset.price) setSummary("price", card.dataset.price);
      const svc = SERVICES[state.serviceId];
      setSummary("duration", svc ? durationText(svc.minutes) : "");
      updateTimeAvailability();
    }
    updateStepper();

    // Auto-scroll to next step on smaller viewports
    if (window.innerWidth < 1128) {
      const nextStep = card.closest(".book-step")?.nextElementSibling;
      if (nextStep && nextStep.classList.contains("book-step")) {
        setTimeout(() => {
          const top =
            nextStep.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: "smooth" });
        }, 180);
      }
    }
  });

  // Initial render so the page loads with the correct list for the
  // pre-selected designer.
  renderServiceList(state.designerId);

  /* ---------- Time slot ---------- */
  document.addEventListener("click", (e) => {
    const slot = e.target.closest(".time-slot");
    if (!slot || slot.classList.contains("is-disabled")) return;
    document.querySelectorAll(".time-slot").forEach((s) => s.classList.remove("is-selected"));
    slot.classList.add("is-selected");
    setSummary("time", slot.textContent.trim());
    updateStepper();
  });

  /* ---------- Calendar day selection ---------- */
  document.addEventListener("click", (e) => {
    const day = e.target.closest(".calendar__day");
    if (!day) return;
    if (day.classList.contains("is-disabled") || day.classList.contains("is-muted")) return;
    document.querySelectorAll(".calendar__day").forEach((d) => d.classList.remove("is-selected"));
    day.classList.add("is-selected");
    const label = day.dataset.label || day.textContent.trim() + "일";
    setSummary("date", label);
    updateStepper();
  });

  /* ---------- Calendar month navigation (lightweight) ---------- */
  const calHeading = document.querySelector('.book-step h3');
  if (calHeading && /\d{4}년 \d{1,2}월/.test(calHeading.textContent)) {
    const wrap = document.createElement("div");
    wrap.className = "cal-nav";
    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "cal-nav__btn";
    prev.setAttribute("aria-label", "이전 달");
    prev.innerHTML =
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
    const next = document.createElement("button");
    next.type = "button";
    next.className = "cal-nav__btn";
    next.setAttribute("aria-label", "다음 달");
    next.innerHTML =
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';

    calHeading.classList.add("cal-heading");
    calHeading.parentNode.insertBefore(wrap, calHeading);
    wrap.appendChild(prev);
    wrap.appendChild(calHeading);
    wrap.appendChild(next);

    const months = [
      "1월","2월","3월","4월","5월","6월",
      "7월","8월","9월","10월","11월","12월",
    ];
    let year = 2026, month = 6;
    const render = () => {
      calHeading.textContent = `${year}년 ${months[month - 1]}`;
    };
    prev.addEventListener("click", () => {
      if (month === 1) { month = 12; year--; } else { month--; }
      render();
      clearDateTime();
      if (window.toast) window.toast(`${months[month - 1]} 일정을 불러왔어요`, { duration: 1400 });
    });
    next.addEventListener("click", () => {
      if (month === 12) { month = 1; year++; } else { month++; }
      render();
      clearDateTime();
      if (window.toast) window.toast(`${months[month - 1]} 일정을 불러왔어요`, { duration: 1400 });
    });
  }

  /* ---------- Textarea char counter ---------- */
  const textarea = document.querySelector(".book-step textarea");
  if (textarea) {
    const MAX = 200;
    textarea.setAttribute("maxlength", String(MAX));
    const counter = document.createElement("div");
    counter.className = "char-counter";
    counter.textContent = `0 / ${MAX}`;
    textarea.parentNode.appendChild(counter);
    textarea.addEventListener("input", () => {
      const n = textarea.value.length;
      counter.textContent = `${n} / ${MAX}`;
      counter.classList.toggle("is-near", n >= MAX * 0.85);
    });
  }

  /* ---------- Phone number formatting/validation ---------- */
  const phone = document.querySelector('input[type="tel"]');
  if (phone) {
    phone.addEventListener("input", () => {
      const raw = phone.value.replace(/[^0-9*]/g, "");
      // Allow masked digits in initial value (e.g., 010-****-0409)
      if (/\*/.test(raw)) return;
      let out = raw;
      if (raw.length >= 4 && raw.length <= 7) out = `${raw.slice(0, 3)}-${raw.slice(3)}`;
      else if (raw.length > 7) out = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
      phone.value = out;
      const valid = /^010-\d{4}-\d{4}$/.test(out);
      phone.classList.toggle("is-invalid", !valid && out.length > 0);
    });
  }

  /* ---------- Confirmation modal ---------- */
  function buildModal() {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button type="button" class="modal__close" aria-label="닫기">×</button>
        <h3 id="modal-title">예약을 확정할까요?</h3>
        <dl class="modal__rows">
          <div><dt>디자이너</dt><dd data-modal="designer"></dd></div>
          <div><dt>시술</dt><dd data-modal="service"></dd></div>
          <div><dt>일정</dt><dd data-modal="when"></dd></div>
          <div><dt>금액</dt><dd data-modal="price"></dd></div>
        </dl>
        <p class="modal__note">예약 확정과 동시에 카카오톡으로 안내 메시지를 보내드려요.</p>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" data-modal-cancel>취소</button>
          <button type="button" class="btn btn--primary" data-modal-confirm>확정하기</button>
        </div>
      </div>
    `;
    return overlay;
  }

  let modalEl = null;
  let releaseTrap = null;
  function openModal() {
    if (!modalEl) {
      modalEl = buildModal();
      document.body.appendChild(modalEl);
    }
    modalEl.querySelector('[data-modal="designer"]').textContent = state.designer;
    modalEl.querySelector('[data-modal="service"]').textContent = state.service;
    modalEl.querySelector('[data-modal="when"]').textContent = `${state.date} · ${state.time}`;
    modalEl.querySelector('[data-modal="price"]').textContent = state.price;

    requestAnimationFrame(() => modalEl.classList.add("is-open"));
    if (window.lockBody) window.lockBody();
    if (window.trapFocus) releaseTrap = window.trapFocus(modalEl);
  }
  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove("is-open");
    if (releaseTrap) { releaseTrap(); releaseTrap = null; }
    if (window.unlockBody) window.unlockBody();
  }

  document.addEventListener("click", (e) => {
    const trigger =
      e.target.closest('.summary-card .btn--primary, .summary-bar .btn--primary') ||
      (e.target.matches(".btn--primary.btn--lg") && /예약 확정/.test(e.target.textContent || "") ? e.target : null);
    if (trigger) {
      e.preventDefault();
      const missing = [];
      if (!state.designerId) missing.push("디자이너");
      if (!state.serviceId) missing.push("시술");
      if (!state.date) missing.push("날짜");
      if (!state.time) missing.push("시간");
      if (missing.length) {
        if (window.toast)
          window.toast(`${missing.join("·")}을(를) 선택해주세요`, { variant: "error", duration: 2200 });
        return;
      }
      openModal();
      return;
    }
    if (!modalEl) return;
    if (e.target === modalEl) closeModal();
    if (e.target.closest("[data-modal-cancel], .modal__close")) closeModal();
    if (e.target.closest("[data-modal-confirm]")) {
      closeModal();
      if (window.toast)
        window.toast("예약이 확정되었어요. 카카오톡을 확인해주세요.", {
          variant: "success",
          duration: 3200,
        });
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalEl && modalEl.classList.contains("is-open")) closeModal();
  });

  /* ---------- Initial stepper sync ---------- */
  updateStepper();
})();
