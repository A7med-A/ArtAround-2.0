// ═══════════════════════════════════════════════════════════════
// ICON PATHS — tracciati SVG su griglia 24×24, stroke-based.
// Ogni voce è una stringa `d` o un array di `d` da disegnare in ordine.
// ═══════════════════════════════════════════════════════════════

export const ICON_PATHS = {
  // Navigazione
  chevL: "M15 18l-6-6 6-6",
  chevR: "M9 18l6-6-6-6",
  chevDown: "M6 9l6 6 6-6",
  chevUp: "M18 15l-6-6-6 6",
  arrowR: "M5 12h14M13 6l6 6-6 6",
  next: "M5 12h14M13 6l6 6-6 6",
  prev: "M19 12H5M11 18l-6-6 6-6",
  close: "M18 6L6 18M6 6l12 12",
  check: "M5 12l5 5L20 7",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",

  // Riproduzione
  play: "M6 4l14 8-14 8z",
  pause: ["M7 4h3v16H7z", "M14 4h3v16h-3z"],
  stop: "M6 6h12v12H6z",
  volume: ["M11 5L6 9H2v6h4l5 4V5z", "M15.5 8.5a5 5 0 010 7"],
  speaker: ["M11 5L6 9H2v6h4l5 4V5z", "M15.5 8.5a5 5 0 010 7", "M19 5a10 10 0 010 14"],
  headphones: [
    "M3 14v-2a9 9 0 0118 0v2",
    "M3 14a2 2 0 012-2h1v6H5a2 2 0 01-2-2zM21 14a2 2 0 00-2-2h-1v6h1a2 2 0 002-2z",
  ],
  mic: [
    "M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z",
    "M19 10v1a7 7 0 01-14 0v-1",
    "M12 18v4M8 22h8",
  ],
  micOff: [
    "M9 5a3 3 0 016 0v5",
    "M19 10v1a7 7 0 01-11.3 5.5M5 10v1a7 7 0 002 4.9",
    "M12 18v4M8 22h8",
    "M3 3l18 18",
  ],

  // Mappa e orientamento
  map: "M1 6l7-4 8 4 7-4v16l-7 4-8-4-7 4V6zM8 2v16M16 6v16",
  location: [
    "M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7z",
    "M12 9a2 2 0 100 4 2 2 0 000-4z",
  ],
  route: [
    "M6 19a2 2 0 100-4 2 2 0 000 4z",
    "M18 9a2 2 0 100-4 2 2 0 000 4z",
    "M8 17h7a3 3 0 003-3V9",
  ],
  target: [
    "M12 3a9 9 0 100 18 9 9 0 000-18z",
    "M12 8a4 4 0 100 8 4 4 0 000-8z",
    "M12 11a1 1 0 100 2 1 1 0 000-2z",
  ],
  zoomIn: ["M11 4a7 7 0 100 14 7 7 0 000-14z", "M20 20l-3.5-3.5", "M11 8v6M8 11h6"],
  zoomOut: ["M11 4a7 7 0 100 14 7 7 0 000-14z", "M20 20l-3.5-3.5", "M8 11h6"],
  layers: ["M12 2l9 5-9 5-9-5z", "M3 12l9 5 9-5", "M3 17l9 5 9-5"],

  // Servizi del museo (allineati a Museum.floors[].cells[].type)
  toilet: [
    "M6 3a2 2 0 100 4 2 2 0 000-4zM4.5 8h3a1 1 0 011 1v5H7v6H5v-6H3.5V9a1 1 0 011-1z",
    "M12 3v18M18 3a2 2 0 100 4 2 2 0 000-4zM15 14l1.5-5h3l1.5 5h-2v7h-2v-7z",
  ],
  bar: "M5 3h14l-2 9a5 5 0 01-10 0L5 3zM12 21v-7M8 21h8",
  exit: ["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  enter: ["M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4", "M10 17l-5-5 5-5", "M3 12h12"],
  accessible: [
    "M12 4a2 2 0 100 4 2 2 0 000-4z",
    "M8 9h6l1 5h2",
    "M9 9v5l-2 6M14 14l2 6",
  ],

  // Contenuti
  grid: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M3 14h7v7H3z", "M14 14h7v7h-7z"],
  list: ["M8 6h13M8 12h13M8 18h13", "M3 6h.01M3 12h.01M3 18h.01"],
  search: ["M11 4a7 7 0 100 14 7 7 0 000-14z", "M20 20l-3.5-3.5"],
  star: "M12 3l2.5 5.5L20 9.5l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1z",
  book: ["M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z", "M4 5v14"],
  brush: [
    "M3 21c2 0 4-1 4-4 0-1.5-1-2.5-2.5-2.5S2 16 2 17.5",
    "M21 3L11 13l3 3L24 6",
  ],
  image: ["M3 4h18v16H3z", "M8 10a2 2 0 100-4 2 2 0 000 4z", "M21 16l-5-5-9 9"],
  tag: ["M3 3h8l10 10-8 8L3 11z", "M7.5 7.5h.01"],
  clock: ["M12 4a8 8 0 100 16 8 8 0 000-16z", "M12 8v4l3 2"],
  info: ["M12 4a8 8 0 100 16 8 8 0 000-16z", "M12 11v5", "M12 8h.01"],
  alert: ["M12 3l9 16H3z", "M12 9v5", "M12 17h.01"],
  refresh: ["M21 12a9 9 0 11-3-6.7", "M21 3v6h-6"],

  // Account e tema
  user: ["M12 12a4 4 0 100-8 4 4 0 000 8z", "M4 21a8 8 0 0116 0"],
  lock: ["M5 11h14v10H5z", "M8 11V7a4 4 0 018 0v4"],
  mail: ["M3 5h18v14H3z", "M3 5l9 7 9-7"],
  logout: ["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  sun: [
    "M12 7a5 5 0 100 10 5 5 0 000-10z",
    "M12 1v2M12 21v2M4 4l1.5 1.5M18.5 18.5L20 20M1 12h2M21 12h2M4 20l1.5-1.5M18.5 5.5L20 4",
  ],
  moon: "M21 12.8A9 9 0 1111.2 3a7 7 0 109.8 9.8z",
  google:
    "M12 11v2.6h3.6c-.15 1-1.13 2.9-3.6 2.9a4 4 0 110-8c1.14 0 1.9.48 2.34.9l1.6-1.54A6 6 0 1018 12a6.8 6.8 0 00-.1-1.4z",
};

export const ICON_NAMES = Object.keys(ICON_PATHS);
