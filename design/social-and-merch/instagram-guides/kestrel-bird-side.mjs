// The side-on flying kestrel from the "Takes flight" Reel, shared so other Reels can reuse it (Steve, 20th November 2026).
// A new illustration in the brand palette, not the logo. Animate the wings with flyWings() below.
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", paper: "#FBF8F2", buff: "#D8B48A", slateBlue: "#7F93AE", farWing: "#6B7F9B" };
const wingPath = `M10 -18 C -20 -90, -80 -150, -160 -172 C -110 -112, -66 -62, -44 -16 Z`;
const wingTip = `M-160 -172 C -128 -150, -104 -128, -86 -108 L -100 -98 C -118 -118, -138 -142, -160 -172 Z`;
const eye = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r * 1.3}" fill="${C.buff}"/><circle cx="${x}" cy="${y}" r="${r}" fill="${C.navy}"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.3}" fill="${C.cream}"/>`;
const HEAD = (x, y) => `
  <circle cx="${x}" cy="${y}" r="36" fill="${C.paper}"/>
  <path d="M${x - 34} ${y - 2} C ${x - 30} ${y - 44}, ${x + 26} ${y - 48}, ${x + 36} ${y - 6} C ${x + 14} ${y - 22}, ${x - 16} ${y - 22}, ${x - 34} ${y - 2} Z" fill="${C.slateBlue}"/>
  <ellipse cx="${x - 2}" cy="${y - 30}" rx="13" ry="7" fill="${C.chestnut}"/>
  <path d="M${x + 6} ${y + 8} l-4 26 h9 l4 -25 Z" fill="${C.navy}"/>
  <path d="M${x - 18} ${y + 2} l-4 24 h8 l4 -23 Z" fill="${C.navy}"/>
  <path d="M${x + 30} ${y - 8} C ${x + 52} ${y - 8}, ${x + 56} ${y + 8}, ${x + 48} ${y + 18} C ${x + 44} ${y + 10}, ${x + 38} ${y + 8}, ${x + 32} ${y + 8} Z" fill="${C.navy}"/>
  ${eye(x + 12, y - 6, 7)}`;
export const FLY = `<g id="fly">
  <g id="farwing"><path d="${wingPath}" fill="${C.farWing}"/><path d="${wingTip}" fill="${C.navy}"/></g>
  <path id="tail" d="M-62 -12 L-176 -28 Q-190 0 -176 28 L-62 12 Z" fill="${C.chestnut}"/>
  <path d="M-154 -25 Q-166 0 -154 25 L-166 27 Q-180 0 -166 -27 Z" fill="${C.navy}"/>
  <ellipse cx="0" cy="0" rx="86" ry="34" fill="${C.chestnut}"/>
  <ellipse cx="8" cy="10" rx="74" ry="22" fill="${C.paper}"/>
  ${[[-30, 10], [0, 16], [30, 8], [-10, 4]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="7" fill="${C.navy}" opacity=".8"/>`).join("")}
  ${HEAD(96, -14)}
  <g id="nearwing"><path d="${wingPath}" fill="${C.slateBlue}"/><path d="${wingTip}" fill="${C.navy}"/>
  ${[0, 1, 2].map((i) => `<path d="M${-30 - i * 30} ${-60 - i * 28} l-16 22" stroke="${C.paper}" stroke-width="5" stroke-linecap="round" opacity=".6"/>`).join("")}</g>
</g>`;

// The wing transforms for a moment in the beat (flap from -1 to 1), as used in "Takes flight": seen side on, the wing swings from above
// the body to below it, foreshortened as it passes the body line.
export const flyWings = (flap) => { const k = 0.1 + 0.9 * flap;
  const wing = (dx, dy, m) => `translate(${10 + dx} ${-18 + dy}) scale(${1.5 * m} ${1.5 * k * m}) rotate(28) translate(-10 18)`;
  return { near: wing(0, 0, 1), far: wing(16, -6, 0.9) }; };

// The perched kestrel from "Takes flight", feet at (0, 0), upright on a treetop.
export const PERCH = `<g id="perch">
  <path d="M-22 -64 L-44 34 Q-28 46 -10 40 L 8 -56 Z" fill="${C.chestnut}"/>
  <path d="M-42 22 Q-27 32 -12 28 L-10 40 Q-28 46 -44 34 Z" fill="${C.navy}"/>
  <ellipse cx="0" cy="-104" rx="46" ry="74" fill="${C.paper}" transform="rotate(-12 0 -104)"/>
  ${[[8, -120], [20, -96], [2, -80], [16, -64]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="7" fill="${C.navy}" opacity=".8"/>`).join("")}
  <path d="M-34 -160 C -60 -110, -56 -50, -26 -4 C -10 -50, -6 -112, -14 -164 Z" fill="${C.chestnut}"/>
  <path d="M-30 -150 C -52 -108, -48 -56, -24 -16 C -12 -56, -10 -110, -16 -152 Z" fill="${C.slateBlue}"/>
  <path d="M-6 -36 v36 M12 -38 v38" stroke="${C.buff}" stroke-width="7" stroke-linecap="round"/>
  ${HEAD(16, -186)}
</g>`;
