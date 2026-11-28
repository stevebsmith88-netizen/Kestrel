// Shared by the find us post (build-find-us.mjs) and its reel (build-find-us-reel.mjs), so both draw the same icons.
export const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", paper: "#FBF8F2", buff: "#D8B48A", line: "#E3D9C8", slate: "#5A6672" };

// Same drawing rules as components/Icon.tsx. Instagram and LinkedIn are copied from it; Facebook and Reddit are new, drawn to match.
export const ICONS = {
  linkedin: `<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 10.5V16.5M8 7.6v.1"/><path d="M11.5 16.5v-6M11.5 13a2.5 2.5 0 0 1 5 0v3.5"/>`,
  facebook: `<circle cx="12" cy="12" r="8.5"/><path d="M13 20.4V11a2.6 2.6 0 0 1 2.6-2.6h1.2"/><path d="M10 13.4h6"/>`,
  instagram: `<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.3 6.7v.1"/>`,
  reddit: `<ellipse cx="12" cy="14.2" rx="8" ry="5.6"/><path d="M9.2 13.6v.1M14.8 13.6v.1"/><path d="M9.4 16.6c1.6 1 3.6 1 5.2 0"/><path d="M12 8.6 13.1 4.2l3.6.9"/><circle cx="18.2" cy="5.4" r="1.4"/><circle cx="4.9" cy="10.4" r="1.6"/><circle cx="19.1" cy="10.4" r="1.6"/>`,
};

// Tile colours for a Cream post, and each tile's tilt (5 to 9 degrees either way, no 2 neighbours the same way).
export const TILES = [
  { key: "linkedin", name: "LinkedIn", handle: "Our company page", bg: C.navy, fg: C.cream, edge: "none", tilt: -7 },
  { key: "facebook", name: "Facebook", handle: "kestreleye26", bg: C.chestnut, fg: C.cream, edge: "none", tilt: 6 },
  { key: "instagram", name: "Instagram", handle: "@kestreleye26", bg: C.paper, fg: C.navy, edge: `inset 0 0 0 3px ${C.line}`, tilt: 8 },
  { key: "reddit", name: "Reddit", handle: "r/EyeCareJobsCanada", bg: C.buff, fg: C.navy, edge: "none", tilt: -5 },
];

