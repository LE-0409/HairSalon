/* ===============================================================
   common.js — site-wide interaction primitives
   - Scroll-shrink header
   - Intersection observer reveal (.reveal → .is-in)
   - Smooth anchor scroll with sticky-nav offset
   - Toast system: window.toast(msg, opts)
   - Body scroll lock helpers: lockBody / unlockBody
   - Reduced-motion respect (sets data-motion="reduce" on <html>)
   =============================================================== */
(function () {
  "use strict";

  const html = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) html.setAttribute("data-motion", "reduce");

  /* ---------- Scroll-shrink header ---------- */
  const header = document.querySelector(".topnav");
  if (header) {
    let lastY = 0;
    let ticking = false;
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      header.classList.toggle("is-scrolled", y > 8);
      header.classList.toggle("is-hidden", y > 240 && y > lastY + 4);
      lastY = y;
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });
    onScroll();
  }

  /* ---------- Reveal animation on scroll ---------- */
  const revealEls = document.querySelectorAll(
    ".section, .designer-card, .review-card, .pick-card, .service-row, .about-grid, .stat-block, .profile-section, .summary-card, .hero__copy, .hero__photo, .searchpill"
  );
  revealEls.forEach((el) => el.classList.add("reveal"));

  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Smooth anchor scroll (respects nav height) ---------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const navH = header ? header.offsetHeight : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navH - 8;
    window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    if (history.replaceState) history.replaceState(null, "", id);
  });

  /* ---------- Toast system ---------- */
  let toastHost = null;
  function ensureToastHost() {
    if (toastHost) return toastHost;
    toastHost = document.createElement("div");
    toastHost.className = "toast-host";
    toastHost.setAttribute("aria-live", "polite");
    toastHost.setAttribute("aria-atomic", "true");
    document.body.appendChild(toastHost);
    return toastHost;
  }
  /**
   * Show a toast.
   * @param {string} message
   * @param {{ duration?: number, variant?: "default"|"success"|"error" }} [opts]
   */
  window.toast = function (message, opts = {}) {
    const host = ensureToastHost();
    const el = document.createElement("div");
    el.className = "toast toast--" + (opts.variant || "default");
    el.textContent = message;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-in"));
    const dur = opts.duration || 2400;
    setTimeout(() => {
      el.classList.remove("is-in");
      el.classList.add("is-out");
      setTimeout(() => el.remove(), 280);
    }, dur);
  };

  /* ---------- Body scroll lock (for modal/drawer) ---------- */
  let lockCount = 0;
  let savedScrollY = 0;
  window.lockBody = function () {
    if (lockCount === 0) {
      savedScrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
    }
    lockCount++;
  };
  window.unlockBody = function () {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      window.scrollTo(0, savedScrollY);
    }
  };

  /* ---------- Scroll-to-top button ---------- */
  const toTop = document.createElement("button");
  toTop.className = "to-top";
  toTop.setAttribute("aria-label", "맨 위로");
  toTop.innerHTML =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 15 12 9 18 15"/></svg>';
  document.body.appendChild(toTop);
  toTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
  window.addEventListener(
    "scroll",
    () => {
      toTop.classList.toggle("is-visible", window.scrollY > 600);
    },
    { passive: true }
  );

  /* ---------- Focus trap helper (exposed) ---------- */
  window.trapFocus = function (container) {
    const focusables = container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return () => {};
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const handler = (e) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    container.addEventListener("keydown", handler);
    first.focus();
    return () => container.removeEventListener("keydown", handler);
  };
})();
