// nav.js — mobile hamburger menu (open / close)
(function () {
  const burger = document.querySelector(".topnav__burger");
  const sheet = document.querySelector(".mobile-sheet");
  if (!burger || !sheet) return;

  const close = () => sheet.classList.remove("is-open");
  const open = () => sheet.classList.add("is-open");

  burger.addEventListener("click", open);

  sheet.addEventListener("click", (e) => {
    if (e.target === sheet) close();                  // scrim tap
    if (e.target.closest("[data-close-sheet]")) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
})();
