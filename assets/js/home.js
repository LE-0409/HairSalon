/* ===============================================================
   home.js — hero search pill quick-select
   Click on a segment opens a small dropdown of options.
   Selection updates the pill label + persists to sessionStorage,
   so the booking page can pre-select on arrival.
   =============================================================== */
(function () {
  "use strict";

  const pill = document.querySelector(".searchpill");
  if (!pill) return;

  const SEGMENTS = [
    {
      key: "service",
      labelText: "어떤 시술",
      options: ["커트", "펌", "염색", "클리닉"],
    },
    {
      key: "designer",
      labelText: "디자이너",
      options: ["김다현", "박수아", "이민지", "정현우", "유서영"],
    },
    {
      key: "date",
      labelText: "언제",
      options: ["오늘", "내일", "이번 주말", "다음 주"],
    },
  ];

  const segEls = pill.querySelectorAll(".searchpill__seg");
  segEls.forEach((el, i) => {
    const def = SEGMENTS[i];
    if (!def) return;
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-haspopup", "listbox");
    el.dataset.segKey = def.key;
    el.dataset.options = JSON.stringify(def.options);
  });

  let popoverEl = null;
  function closePopover() {
    if (!popoverEl) return;
    popoverEl.classList.remove("is-open");
    setTimeout(() => {
      if (popoverEl && !popoverEl.classList.contains("is-open")) {
        popoverEl.remove();
        popoverEl = null;
      }
    }, 180);
  }

  function openPopover(seg) {
    closePopover();
    const options = JSON.parse(seg.dataset.options || "[]");
    const valueEl = seg.querySelector(".searchpill__value");
    const current = valueEl ? valueEl.textContent.trim() : "";

    popoverEl = document.createElement("div");
    popoverEl.className = "searchpill__pop";
    popoverEl.setAttribute("role", "listbox");
    options.forEach((opt) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "searchpill__pop-item";
      item.setAttribute("role", "option");
      item.textContent = opt;
      if (opt === current) item.classList.add("is-selected");
      item.addEventListener("click", () => {
        if (valueEl) valueEl.textContent = opt;
        seg.classList.add("is-filled");
        try {
          sessionStorage.setItem("rausch.search." + seg.dataset.segKey, opt);
        } catch {}
        if (window.toast) window.toast(`${opt} 선택됨`, { duration: 1200 });
        closePopover();
      });
      popoverEl.appendChild(item);
    });

    document.body.appendChild(popoverEl);
    const r = seg.getBoundingClientRect();
    popoverEl.style.top = `${window.scrollY + r.bottom + 8}px`;
    popoverEl.style.left = `${Math.max(12, r.left)}px`;
    popoverEl.style.minWidth = `${Math.max(180, r.width)}px`;
    requestAnimationFrame(() => popoverEl.classList.add("is-open"));
  }

  pill.addEventListener("click", (e) => {
    const seg = e.target.closest(".searchpill__seg");
    if (seg) {
      e.preventDefault();
      openPopover(seg);
    }
  });

  pill.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const seg = e.target.closest(".searchpill__seg");
    if (seg) {
      e.preventDefault();
      openPopover(seg);
    }
  });

  document.addEventListener("click", (e) => {
    if (!popoverEl) return;
    if (e.target.closest(".searchpill__pop") || e.target.closest(".searchpill__seg")) return;
    closePopover();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePopover();
  });
  window.addEventListener("scroll", closePopover, { passive: true });

  // Restore prior selections within the session
  segEls.forEach((seg) => {
    try {
      const saved = sessionStorage.getItem("rausch.search." + seg.dataset.segKey);
      if (saved) {
        const valueEl = seg.querySelector(".searchpill__value");
        if (valueEl) valueEl.textContent = saved;
        seg.classList.add("is-filled");
      }
    } catch {}
  });
})();
