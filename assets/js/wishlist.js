/* ===============================================================
   wishlist.js — heart toggle on designer cards with localStorage
   Strategy:
   - Designer card hearts inside .designer-card. Identify by closest
     link's href (e.g., designer.html) + designer initial text fallback.
   - Persist a set of designer keys; restore .is-liked on load.
   - Click pops the heart (CSS animation) and toasts.
   =============================================================== */
(function () {
  "use strict";

  const STORAGE_KEY = "rausch.wishlist.v1";

  function load() {
    try {
      return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []);
    } catch {
      return new Set();
    }
  }
  function save(set) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
    } catch {
      /* quota/privacy mode — ignore */
    }
  }

  function keyOf(heart) {
    const card = heart.closest(".designer-card");
    if (!card) return null;
    const initial = card.querySelector(".designer-card__initial");
    const name = card.querySelector(".designer-card__name span");
    return (
      (name && name.textContent.trim()) ||
      (initial && initial.textContent.trim()) ||
      card.href ||
      null
    );
  }

  const liked = load();

  // Restore state
  document.querySelectorAll(".designer-card__heart").forEach((heart) => {
    const k = keyOf(heart);
    if (!k) return;
    heart.setAttribute("type", "button");
    heart.setAttribute("aria-pressed", "false");
    if (liked.has(k)) {
      heart.classList.add("is-liked");
      heart.setAttribute("aria-pressed", "true");
      heart.textContent = "♥";
    }
  });

  document.addEventListener("click", (e) => {
    const heart = e.target.closest(".designer-card__heart");
    if (!heart) return;
    e.preventDefault();
    e.stopPropagation();

    const k = keyOf(heart);
    if (!k) return;

    const wasLiked = liked.has(k);
    if (wasLiked) {
      liked.delete(k);
      heart.classList.remove("is-liked");
      heart.setAttribute("aria-pressed", "false");
      heart.textContent = "♡";
    } else {
      liked.add(k);
      heart.classList.add("is-liked");
      heart.setAttribute("aria-pressed", "true");
      heart.textContent = "♥";
    }
    heart.classList.remove("pop");
    void heart.offsetWidth;
    heart.classList.add("pop");

    save(liked);
    if (window.toast) {
      window.toast(wasLiked ? `${k} 찜 해제` : `${k} 찜에 추가`, {
        variant: wasLiked ? "default" : "success",
        duration: 1600,
      });
    }
  });
})();
