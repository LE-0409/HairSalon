/* ===============================================================
   reviews.js — category tab filter (reviews + designers pages)
   - Reviews: filter by data-review-designer
   - Designers: filter by tag text inside .designer-card__tags
   - Fade transition + empty state + sessionStorage persistence
   =============================================================== */
(function () {
  "use strict";

  const tabs = document.querySelectorAll(".cat-tabs .cat-tab");
  if (!tabs.length) return;

  const STORAGE_KEY = "rausch.lastFilter." + location.pathname;
  const reviewCards = document.querySelectorAll("[data-review-designer]");
  const designerCards = document.querySelectorAll(".designer-card");
  const isReviewsPage = reviewCards.length > 0;
  const grid = document.querySelector(".grid-cards");

  function ensureEmptyState() {
    if (!grid) return null;
    let empty = grid.parentNode.querySelector(".filter-empty");
    if (!empty) {
      empty = document.createElement("div");
      empty.className = "filter-empty";
      empty.innerHTML = `
        <div class="filter-empty__inner">
          <strong>해당 조건의 결과가 없어요</strong>
          <p>다른 카테고리를 골라보세요.</p>
        </div>
      `;
      empty.hidden = true;
      grid.parentNode.insertBefore(empty, grid.nextSibling);
    }
    return empty;
  }
  const emptyEl = ensureEmptyState();

  function isAll(filter) {
    return !filter || filter === "all" || filter === "전체";
  }

  function applyFilter(filter) {
    let visibleCount = 0;
    const all = isAll(filter);

    if (isReviewsPage) {
      reviewCards.forEach((card) => {
        const show = all || card.dataset.reviewDesigner === filter;
        card.classList.toggle("is-hidden", !show);
        if (show) visibleCount++;
      });
    } else {
      // Designers page: filter by tag text
      designerCards.forEach((card) => {
        const tagText = [...card.querySelectorAll(".tag")]
          .map((t) => t.textContent.trim())
          .join(" ");
        const show = all || tagText.includes(filter);
        card.classList.toggle("is-hidden", !show);
        if (show) visibleCount++;
      });
    }

    if (emptyEl) emptyEl.hidden = visibleCount > 0;
    if (grid) grid.classList.toggle("is-empty", visibleCount === 0);
  }

  function tabFilter(tab) {
    // Prefer explicit data-filter; else strip trailing count like "김다현 342".
    return tab.dataset.filter || tab.textContent.trim().replace(/\s+\d+$/, "");
  }

  function activateTab(tab, persist = true) {
    const group = tab.closest(".cat-tabs");
    if (!group) return;
    group.querySelectorAll(".cat-tab").forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    const filter = tabFilter(tab);
    applyFilter(filter);
    if (persist) {
      try { sessionStorage.setItem(STORAGE_KEY, filter); } catch {}
    }
  }

  document.addEventListener("click", (e) => {
    const tab = e.target.closest(".cat-tab");
    if (!tab || !tab.closest(".cat-tabs")) return;
    activateTab(tab);
  });

  // Restore last filter (within the session)
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const match = [...tabs].find((t) => tabFilter(t) === saved);
      if (match) activateTab(match, false);
    }
  } catch {}
})();
