// reviews.js — designer category tab filter
(function () {
  const tabs = document.querySelectorAll(".cat-tabs .cat-tab");
  if (!tabs.length) return;

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
})();
