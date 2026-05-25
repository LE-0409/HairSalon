/* ===============================================================
   services-data.js — Shared service-menu data layer
   - DEFAULT_SERVICES: seed catalog (aligned with the booking page)
   - ServiceStore.list() / get(id) / save(id, patch) / reset()
   - Mirrors DesignerStore's shape; both stores swap to a real backend
     by replacing this module's storage helpers.
   =============================================================== */
(function () {
  "use strict";

  const STORAGE_KEY = "rausch.services.v1";

  // Same tone palette designers use, so leftover tone fallbacks stay coherent.
  const TONE_OPTIONS = ["rose", "warm", "cocoa", "forest", "lilac", "ocean", "charcoal", "cream"];
  // 30-minute grid steps so booking time-slot math (minutes/30) always lines up.
  const DURATION_OPTIONS = [30, 60, 90, 120, 150, 180, 210, 240];

  const DEFAULT_SERVICES = [
    { id: "signature", name: "시그니처 컷",   price: 80000,  desc: "두상·머릿결·라이프스타일 1:1 진단 후 시술.",          minutes: 60,  tone: "rose",     photo: null },
    { id: "balayage",  name: "발레아쥬 (염색)", price: 220000, desc: "자연스러운 그라데이션, 햇빛에 색이 살아남.",            minutes: 180, tone: "warm",     photo: null },
    { id: "layered",   name: "레이어드 컷",   price: 65000,  desc: "긴 머리 가볍게, 짧은 머리에 입체감을. 결대로 정리합니다.", minutes: 30,  tone: "lilac",    photo: null },
    { id: "scalp",     name: "두피 클리닉",   price: 85000,  desc: "두피 진단 후 맞춤 케어. 시술과 함께 권장.",              minutes: 30,  tone: "forest",   photo: null },
    { id: "downperm",  name: "남자 다운펌",   price: 95000,  desc: "자고 일어나도 망가지지 않는 자연스런 결.",               minutes: 120, tone: "cocoa",    photo: null },
    { id: "babyperm",  name: "베이비펌",     price: 110000, desc: "자연스러운 C컬, 손상 최소화 처방.",                       minutes: 120, tone: "lilac",    photo: null },
    { id: "ash",       name: "애쉬 컬러",    price: 180000, desc: "노란기 없는 깔끔한 회갈색 톤.",                            minutes: 180, tone: "ocean",    photo: null },
    { id: "ombre",     name: "옴브레",       price: 160000, desc: "탈색 자국 없는 자연스런 그라데이션.",                      minutes: 180, tone: "warm",     photo: null },
    { id: "mens",      name: "남자컷",       price: 38000,  desc: "댄디·투블럭 등 결대로 깔끔하게 다듬어드립니다.",            minutes: 30,  tone: "charcoal", photo: null },
    { id: "dandy",     name: "댄디컷",       price: 42000,  desc: "부드럽게 흐르는 라인의 클래식 남자 스타일.",                minutes: 30,  tone: "charcoal", photo: null },
  ];

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadOverrides() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveOverrides(map) {
    // Bubble QuotaExceededError so the admin can surface it.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }

  function mergeOverrides(seed) {
    const overrides = loadOverrides();
    return seed.map((s) => {
      const patch = overrides[s.id];
      return patch ? Object.assign({}, s, patch) : s;
    });
  }

  function compressImage(file, opts) {
    const maxEdge = (opts && opts.maxEdge) || 800;
    const quality = (opts && opts.quality) || 0.82;
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error("파일이 없습니다."));
      if (!/^image\//.test(file.type)) return reject(new Error("이미지 파일만 업로드할 수 있어요."));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("파일을 읽지 못했어요."));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("이미지를 불러오지 못했어요."));
        img.onload = () => {
          const longest = Math.max(img.width, img.height);
          const scale = Math.min(1, maxEdge / longest);
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          try {
            resolve(canvas.toDataURL("image/jpeg", quality));
          } catch (e) {
            reject(e);
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function formatPrice(n) {
    const num = Number(n) || 0;
    return "₩ " + num.toLocaleString("ko-KR");
  }

  const ServiceStore = {
    TONE_OPTIONS,
    DURATION_OPTIONS,

    list() {
      return mergeOverrides(deepClone(DEFAULT_SERVICES));
    },
    get(id) {
      return this.list().find((s) => s.id === id) || null;
    },
    save(id, patch) {
      const overrides = loadOverrides();
      overrides[id] = Object.assign({}, overrides[id] || {}, patch);
      saveOverrides(overrides);
      return this.get(id);
    },
    reset() {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    },
    formatPrice,
    compressImage,
  };

  window.ServiceStore = ServiceStore;
})();
