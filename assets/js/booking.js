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

  /* ---------- Catalog (would come from API in full-stack stage) ----------
     `minutes` is always one of {30, 60, 120, 180} so it lines up with
     the 30-min time-slot grid below. */
  const SERVICES = {
    signature: { label: "시그니처 컷",    price: "₩ 80,000",  desc: "두상·머릿결·라이프스타일을 1:1로 진단하고 직접 컷합니다.", minutes: 60,  tone: "rose" },
    balayage:  { label: "발레아쥬 (염색)", price: "₩ 220,000", desc: "자연스러운 그라데이션. 햇빛에 색이 살아나는 시그니처 컬러.", minutes: 180, tone: "warm" },
    layered:   { label: "레이어드 컷",    price: "₩ 65,000",  desc: "긴 머리 가볍게, 짧은 머리에 입체감을. 결대로 정리합니다.", minutes: 30,  tone: "lilac" },
    scalp:     { label: "두피 클리닉",    price: "₩ 85,000",  desc: "두피 진단 후 맞춤 케어. 시술과 함께 받으시면 더 효과적이에요.", minutes: 30,  tone: "forest" },
    downperm:  { label: "남자 다운펌",    price: "₩ 95,000",  desc: "자고 일어나도 망가지지 않는 결대로의 펌.",            minutes: 120, tone: "cocoa" },
    babyperm:  { label: "베이비펌",      price: "₩ 110,000", desc: "자연스러운 C컬, 손상 최소화 처방.",                  minutes: 120, tone: "lilac" },
    ash:       { label: "애쉬 컬러",     price: "₩ 180,000", desc: "노란기 없는 깔끔한 회갈색 톤.",                       minutes: 180, tone: "ocean" },
    ombre:     { label: "옴브레",        price: "₩ 160,000", desc: "탈색 자국 없는 자연스런 그라데이션.",                 minutes: 180, tone: "warm" },
    mens:      { label: "남자컷",        price: "₩ 38,000",  desc: "댄디·투블럭 등 결대로 깔끔하게 다듬어드립니다.",       minutes: 30,  tone: "charcoal" },
    dandy:     { label: "댄디컷",        price: "₩ 42,000",  desc: "부드럽게 흐르는 라인의 클래식 남자 스타일.",          minutes: 30,  tone: "charcoal" },
  };
  const durationText = (m) => `약 ${m}분`;

  const DESIGNERS = {
    dahyun:  { label: "김다현 (대표·16년차)",   short: "김다현 대표",   services: ["signature", "balayage", "layered", "scalp"] },
    sooa:    { label: "박수아 (부원장·11년차)", short: "박수아 부원장", services: ["signature", "downperm", "mens", "scalp"] },
    minji:   { label: "이민지 (실장·8년차)",   short: "이민지 실장",   services: ["signature", "babyperm", "scalp"] },
    hyunwoo: { label: "정현우 (디자이너·6년차)", short: "정현우 디자이너", services: ["signature", "downperm", "ash", "scalp"] },
    suyoung: { label: "유서영 (실장·9년차)",   short: "유서영 실장",   services: ["signature", "layered", "balayage", "scalp"] },
    taeri:   { label: "한태리 (디자이너·5년차)", short: "한태리 디자이너", services: ["balayage", "babyperm", "ombre", "scalp"] },
    seoyoon: { label: "최서윤 (디자이너·4년차)", short: "최서윤 디자이너", services: ["babyperm", "ash", "scalp"] },
    junho:   { label: "강준호 (디자이너·5년차)", short: "강준호 디자이너", services: ["mens", "dandy", "downperm"] },
  };

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
        return `
          <div class="service-row" data-pick data-pick-group="service" data-service-id="${sid}" data-label="${s.label}" data-price="${s.price}">
            <div class="service-row__photo" data-tone="${s.tone}"></div>
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
