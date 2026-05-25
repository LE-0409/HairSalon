/* ===============================================================
   designers-data.js — Shared designer data layer
   - DEFAULT_DESIGNERS: seed data (matches the original detail page)
   - DesignerStore.list() / get(id) / save(id, patch) / reset()
   - Currently backed by localStorage; the same shape will swap to
     a fetch-based backend later without touching the call sites.
   =============================================================== */
(function () {
  "use strict";

  // Bumped to v2 when `services` flipped from display names to ServiceStore ids.
  const STORAGE_KEY = "rausch.designers.v2";

  // `tone` / `portfolioTones` stay as a silent gradient fallback so the page
  // never looks broken before any photo is uploaded. They are NOT editable
  // in admin — `photo` (base64 data URL) and `portfolioPhotos` (array) take
  // precedence when present.
  const TONE_OPTIONS = ["rose", "warm", "cocoa", "forest", "lilac", "ocean", "charcoal", "cream"];
  const ROLE_OPTIONS = ["대표", "부원장", "실장", "디자이너"];

  const PORTFOLIO_SLOTS = 6;

  const DEFAULT_DESIGNERS = [
    {
      id: "dahyun",
      name: "김다현",
      nameEn: "Dahyun Kim",
      initial: "다",
      role: "대표",
      isPrincipal: true,
      eyebrow: "대표 디자이너",
      roleSubtitle: "시그니처 컷 · 발레아쥬 전문 · 16년차",
      years: 16,
      tone: "rose",
      rating: 4.97,
      reviewCount: 342,
      bio: "16년차 · 시그니처 컷, 발레아쥬 전문",
      intro:
        "시술 전 두상과 머릿결, 그리고 자신의 라이프스타일을 충분히 듣고 시작합니다. 화려한 변화보다 매일 아침 손질이 쉬워지는 시술을 선호합니다. 프랑스 발레아쥬 기법을 한국인의 두상에 맞춰 변형한 시그니처 컷이 대표 작품입니다.",
      specialties: ["시그니처 컷", "발레아쥬", "레이어드 컷", "옴브레", "로우 라이트", "두피 클리닉"],
      career: [
        "Salon Rausch · 대표 디자이너 (2018 – 현재)",
        "Hair by Mood · 부원장 (2015 – 2018)",
        "Chahong Ardor 청담 본점 · 디자이너 (2012 – 2015)",
        "Park Jun Beauty Lab · 인턴 → 스타일리스트 (2008 – 2012)"
      ],
      education: [
        "L'Oréal Professionnel Paris · 발레아쥬 마스터 코스 수료 (2019)",
        "Vidal Sassoon London · ABC Cutting & Coloring 수료 (2017)",
        "KOSCO 한국직업능력개발원 · 헤어 디자인 전임 강사 (2020 – 현재)",
        "글로벌 컬러리스트 자격증 · IPC Korea (2016)"
      ],
      services: ["signature", "balayage", "scalp"],
      tags: ["시그니처 컷", "발레아쥬"],
      portfolioTones: ["rose", "cocoa", "warm", "forest", "lilac", "cream"],
      photo: null,
      portfolioPhotos: []
    },
    {
      id: "sua",
      name: "박수아",
      nameEn: "Sua Park",
      initial: "수",
      role: "부원장",
      isPrincipal: false,
      eyebrow: "부원장",
      roleSubtitle: "남자 컷 · 다운펌 전문 · 11년차",
      years: 11,
      tone: "warm",
      rating: 4.95,
      reviewCount: 218,
      bio: "11년차 · 컷, 다운펌, 클리닉",
      intro:
        "자고 일어나도 다시 잡히는 자연스러운 결을 가장 중요하게 생각합니다. 짧은 머리 시술에서 두상 비율과 옆모습 라인을 함께 봅니다. 남자 손님의 컷·다운펌이 전체 시술의 70%를 차지합니다.",
      specialties: ["남자 컷", "다운펌", "댄디컷", "투블럭", "두피 클리닉"],
      career: [
        "Salon Rausch · 부원장 (2020 – 현재)",
        "Hair by Mood · 디자이너 (2016 – 2020)",
        "Juno Hair 강남점 · 스타일리스트 (2013 – 2016)"
      ],
      education: [
        "Toni & Guy 본사 · Men's Cutting 마스터 클래스 (2021)",
        "Mucota Japan · 다운펌 케미컬 코스 (2019)"
      ],
      services: ["signature", "downperm", "mens", "scalp"],
      tags: ["다운펌", "남자컷"],
      portfolioTones: ["warm", "cocoa", "charcoal", "forest", "ocean", "cream"],
      photo: null,
      portfolioPhotos: []
    },
    {
      id: "minji",
      name: "이민지",
      nameEn: "Minji Lee",
      initial: "민",
      role: "실장",
      isPrincipal: false,
      eyebrow: "실장",
      roleSubtitle: "베이비펌 · 시스루뱅 전문 · 8년차",
      years: 8,
      tone: "cocoa",
      rating: 4.92,
      reviewCount: 176,
      bio: "8년차 · 컷, 베이비펌, 클리닉",
      intro:
        "자연스러운 C컬과 손상 최소화 처방을 중시합니다. 어울리는 앞머리 비율을 가장 먼저 잡고, 머리 결에 맞는 약제로 시술합니다. 베이비펌 단골 손님이 많은 디자이너입니다.",
      specialties: ["베이비펌", "시스루뱅", "레이어드 컷", "두피 클리닉"],
      career: [
        "Salon Rausch · 실장 (2021 – 현재)",
        "Lee Hair Lab · 디자이너 (2018 – 2021)",
        "준오헤어 압구정 · 인턴 → 디자이너 (2016 – 2018)"
      ],
      education: [
        "Wella Professionals · 펌 케미스트리 코스 (2020)",
        "쟈끄데샹쥬 아카데미 · 베이비펌 심화 과정 (2019)"
      ],
      services: ["signature", "babyperm", "scalp"],
      tags: ["베이비펌", "시스루"],
      portfolioTones: ["cocoa", "lilac", "rose", "cream", "warm", "forest"],
      photo: null,
      portfolioPhotos: []
    },
    {
      id: "hyunwoo",
      name: "정현우",
      nameEn: "Hyunwoo Jung",
      initial: "현",
      role: "디자이너",
      isPrincipal: false,
      eyebrow: "디자이너",
      roleSubtitle: "애쉬 컬러 · 댄디컷 전문 · 6년차",
      years: 6,
      tone: "lilac",
      rating: 4.9,
      reviewCount: 121,
      bio: "6년차 · 컷, 다운펌, 애쉬 컬러",
      intro:
        "노란기 없는 깔끔한 회갈색 톤이 시그니처입니다. 한국인 모발 멜라닌에 맞춰 약제를 2단계로 나눠 시술해, 컬러 후에도 머릿결이 무겁지 않도록 합니다.",
      specialties: ["애쉬 컬러", "올리브 브라운", "댄디컷", "다운펌"],
      career: [
        "Salon Rausch · 디자이너 (2022 – 현재)",
        "Bichae Hair · 스타일리스트 (2020 – 2022)",
        "차홍룸 · 인턴 (2019 – 2020)"
      ],
      education: [
        "Goldwell Color Zoom · 어드밴스드 컬러 (2023)",
        "L'Oréal Korea · 톤 다운 컬러 마스터 코스 (2022)"
      ],
      services: ["signature", "downperm", "ash", "scalp"],
      tags: ["애쉬 컬러", "댄디컷"],
      portfolioTones: ["lilac", "ocean", "charcoal", "forest", "cocoa", "warm"],
      photo: null,
      portfolioPhotos: []
    },
    {
      id: "seoyoung",
      name: "유서영",
      nameEn: "Seoyoung Yoo",
      initial: "유",
      role: "실장",
      isPrincipal: false,
      eyebrow: "실장",
      roleSubtitle: "레이어드 컷 · 발레아쥬 전문 · 9년차",
      years: 9,
      tone: "ocean",
      rating: 4.88,
      reviewCount: 154,
      bio: "9년차 · 컷, 발레아쥬, 클리닉",
      intro:
        "긴 머리에서 자연스럽게 떨어지는 레이어를 잘 잡습니다. 시술 전 두피 상태부터 점검해 약제 농도와 시간 모두 개인화합니다.",
      specialties: ["레이어드 컷", "발레아쥬", "옴브레", "두피 클리닉"],
      career: [
        "Salon Rausch · 실장 (2021 – 현재)",
        "Mood Hair · 디자이너 (2017 – 2021)",
        "이가자헤어 청담 · 스타일리스트 (2015 – 2017)"
      ],
      education: [
        "Vidal Sassoon London · Layered Cut 마스터 (2022)",
        "L'Oréal Professionnel · 발레아쥬 코스 (2020)"
      ],
      services: ["signature", "balayage", "layered", "scalp"],
      tags: ["레이어드 컷", "시그니처 컷"],
      portfolioTones: ["ocean", "forest", "cream", "warm", "rose", "cocoa"],
      photo: null,
      portfolioPhotos: []
    },
    {
      id: "taeri",
      name: "한태리",
      nameEn: "Taeri Han",
      initial: "태",
      role: "디자이너",
      isPrincipal: false,
      eyebrow: "디자이너",
      roleSubtitle: "발레아쥬 · 옴브레 전문 · 5년차",
      years: 5,
      tone: "forest",
      rating: 4.87,
      reviewCount: 98,
      bio: "5년차 · 발레아쥬, 베이비펌, 클리닉",
      intro:
        "햇빛에서 살아나는 그라데이션 톤을 좋아합니다. 자연스러운 옴브레와 발레아쥬가 주력이며, 시술 후 홈케어까지 자세히 안내합니다.",
      specialties: ["발레아쥬", "옴브레", "베이비펌", "두피 클리닉"],
      career: [
        "Salon Rausch · 디자이너 (2023 – 현재)",
        "Chez Vie Hair · 스타일리스트 (2020 – 2023)",
        "박승철헤어스투디오 · 인턴 (2019 – 2020)"
      ],
      education: [
        "Schwarzkopf BlondMe · 발레아쥬 어드밴스 (2023)",
        "Wella Color Touch · 매뉴얼 코스 (2022)"
      ],
      services: ["balayage", "babyperm", "ombre", "scalp"],
      tags: ["발레아쥬", "옴브레"],
      portfolioTones: ["forest", "warm", "rose", "cocoa", "ocean", "cream"],
      photo: null,
      portfolioPhotos: []
    },
    {
      id: "seoyun",
      name: "최서윤",
      nameEn: "Seoyun Choi",
      initial: "서",
      role: "디자이너",
      isPrincipal: false,
      eyebrow: "디자이너",
      roleSubtitle: "베이비펌 · 애쉬 컬러 전문 · 4년차",
      years: 4,
      tone: "cream",
      rating: 4.86,
      reviewCount: 73,
      bio: "4년차 · 베이비펌, 애쉬 컬러",
      intro:
        "트렌드에 민감한 20대 손님들이 많습니다. 베이비펌과 톤 다운 컬러를 조합한 시술이 주력이며, 손상도가 낮은 약제를 선호합니다.",
      specialties: ["베이비펌", "애쉬 컬러", "시스루뱅"],
      career: [
        "Salon Rausch · 디자이너 (2024 – 현재)",
        "Edge Hair · 스타일리스트 (2022 – 2024)"
      ],
      education: [
        "Mucota · 펌·트리트먼트 코스 (2023)"
      ],
      services: ["babyperm", "ash", "scalp"],
      tags: ["베이비펌", "애쉬 컬러"],
      portfolioTones: ["cream", "rose", "lilac", "warm", "cocoa", "ocean"],
      photo: null,
      portfolioPhotos: []
    },
    {
      id: "junho",
      name: "강준호",
      nameEn: "Junho Kang",
      initial: "준",
      role: "디자이너",
      isPrincipal: false,
      eyebrow: "디자이너",
      roleSubtitle: "남자 컷 · 댄디컷 전문 · 5년차",
      years: 5,
      tone: "charcoal",
      rating: 4.84,
      reviewCount: 88,
      bio: "5년차 · 남자컷, 댄디컷",
      intro:
        "남성 컷 단골이 많습니다. 두상과 헤어라인을 살리는 댄디·투블럭 스타일이 주력이며, 자고 일어나도 손질이 쉬운 컷을 추구합니다.",
      specialties: ["남자 컷", "댄디컷", "투블럭", "다운펌"],
      career: [
        "Salon Rausch · 디자이너 (2023 – 현재)",
        "Blow Hair · 스타일리스트 (2020 – 2023)"
      ],
      education: [
        "Toni & Guy · Men's Classic Cut 과정 (2022)"
      ],
      services: ["mens", "dandy", "downperm"],
      tags: ["남자컷", "댄디컷"],
      portfolioTones: ["charcoal", "ocean", "cocoa", "forest", "warm", "cream"],
      photo: null,
      portfolioPhotos: []
    }
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
    // Bubble QuotaExceededError so the caller can show a useful message; that
    // happens when too many large images get base64-stuffed into localStorage.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }

  function mergeOverrides(seed) {
    const overrides = loadOverrides();
    return seed.map((d) => {
      const patch = overrides[d.id];
      return patch ? Object.assign({}, d, patch) : d;
    });
  }

  /**
   * Compress an uploaded image to a base64 data URL.
   * Resizes the longest edge to `maxEdge` (default 800) and re-encodes as JPEG
   * so localStorage usage stays under control until a real backend takes over.
   */
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

  const DesignerStore = {
    TONE_OPTIONS,
    ROLE_OPTIONS,
    PORTFOLIO_SLOTS,

    list() {
      return mergeOverrides(deepClone(DEFAULT_DESIGNERS));
    },
    get(id) {
      const all = this.list();
      return all.find((d) => d.id === id) || null;
    },
    save(id, patch) {
      const overrides = loadOverrides();
      overrides[id] = Object.assign({}, overrides[id] || {}, patch);
      try {
        saveOverrides(overrides);
      } catch (e) {
        throw e;
      }
      return this.get(id);
    },
    reset() {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    },
    compressImage,
  };

  window.DesignerStore = DesignerStore;
})();
