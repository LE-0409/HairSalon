/* ===============================================================
   nav.js — mobile hamburger + focus trap + body scroll lock
   =============================================================== */
(function () {
  "use strict";
  const burger = document.querySelector(".topnav__burger");
  const sheet = document.querySelector(".mobile-sheet");
  if (!burger || !sheet) return;

  let releaseTrap = null;

  function open() {
    sheet.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
    burger.setAttribute("aria-expanded", "true");
    if (window.lockBody) window.lockBody();
    if (window.trapFocus) releaseTrap = window.trapFocus(sheet);
  }
  function close() {
    if (!sheet.classList.contains("is-open")) return;
    sheet.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
    burger.setAttribute("aria-expanded", "false");
    if (releaseTrap) {
      releaseTrap();
      releaseTrap = null;
    }
    if (window.unlockBody) window.unlockBody();
    burger.focus();
  }

  burger.setAttribute("aria-expanded", "false");
  burger.addEventListener("click", open);

  sheet.addEventListener("click", (e) => {
    if (e.target === sheet) close();
    if (e.target.closest("[data-close-sheet]")) close();
    if (e.target.closest("a[href]")) {
      // Let the link navigate, then close visually.
      setTimeout(close, 0);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sheet.classList.contains("is-open")) close();
  });
})();
