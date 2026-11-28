// Shared pieces for the Christmas Reels (Steve, 28th November 2026), so the kestrel looks the same in each: a hat in the brand colours,
// and the beak redrawn in a real kestrel's colours (blue grey, with a buff cere) so it shows on the navy night sky. Both sit on a head
// centred at (x, y), as drawn by HEAD() in kestrel-bird-side.mjs: (16, -186) on PERCH, (96, -14) on FLY. The illustration, not the logo.
const C = { chestnut: "#A4502C", deep: "#8C4024", cream: "#F7F1E6", buff: "#D8B48A" };
export const HAT = (x, y) => `<g>
  <path d="M${x - 30} ${y - 26} C ${x - 24} ${y - 70}, ${x - 40} ${y - 92}, ${x - 72} ${y - 98} C ${x - 44} ${y - 80}, ${x + 10} ${y - 70}, ${x + 30} ${y - 30} Z" fill="${C.chestnut}"/>
  <path d="M${x - 30} ${y - 26} C ${x - 24} ${y - 60}, ${x - 34} ${y - 80}, ${x - 56} ${y - 92}" fill="none" stroke="${C.deep}" stroke-width="5" opacity=".6"/>
  <rect x="${x - 38}" y="${y - 38}" width="74" height="18" rx="9" fill="${C.cream}" transform="rotate(-6 ${x} ${y - 30})"/>
  <circle cx="${x - 74}" cy="${y - 98}" r="12" fill="${C.cream}"/></g>`;
export const BEAK = (x, y) => `<path d="M${x + 30} ${y - 8} C ${x + 52} ${y - 8}, ${x + 56} ${y + 8}, ${x + 48} ${y + 18} C ${x + 44} ${y + 10}, ${x + 38} ${y + 8}, ${x + 32} ${y + 8} Z" fill="#9FB0C6" stroke="${C.cream}" stroke-width="2"/>
  <ellipse cx="${x + 33}" cy="${y - 1}" rx="7" ry="8" fill="${C.buff}"/>`;
export const BRANCH = `<path d="M-200 6 Q-20 -8 190 14" fill="none" stroke="${C.deep}" stroke-width="14" stroke-linecap="round"/><path d="M-170 -2 Q-40 -20 80 -8 Q-40 -2 -170 -2 Z" fill="${C.cream}"/>`;

// A Christmas tree in the brand colours (Steve, 28th November 2026: "hero image on the tree"). Its tip is at (0, 0), so PERCH (feet at
// (0, 0)) stands on top of it like the star; the tree hangs down about 700 pixels at scale 1.
const T = { tier: "#7F93AE", shade: "#6B7F9B", cream: "#F7F1E6", buff: "#D8B48A", chestnut: "#A4502C", deep: "#8C4024" };
const tier = (y0, y1, w) => `<path d="M0 ${y0} L${w / 2} ${y1} Q0 ${y1 + 26} ${-w / 2} ${y1} Z" fill="${T.tier}"/>
  <path d="M${w / 2} ${y1} Q0 ${y1 + 26} ${-w / 2} ${y1} Q${-w / 4} ${y1 - 14} 0 ${y1 - 4} Q${w / 4} ${y1 - 14} ${w / 2} ${y1} Z" fill="${T.cream}"/>`;
const bauble = (x, y, c) => `<circle cx="${x}" cy="${y}" r="14" fill="${c}"/><circle cx="${x - 4}" cy="${y - 4}" r="4" fill="${T.cream}" opacity=".7"/>`;
export const TREE = `<g>
  <rect x="-34" y="610" width="68" height="90" rx="8" fill="${T.deep}"/>
  ${tier(0, 230, 240)}${tier(130, 420, 380)}${tier(300, 620, 520)}
  <path d="M-70 120 Q0 150 80 110 M-130 300 Q0 345 140 290 M-190 480 Q0 535 200 470" fill="none" stroke="${T.buff}" stroke-width="5" stroke-dasharray="2 18" stroke-linecap="round"/>
  ${bauble(-40, 180, T.chestnut)}${bauble(50, 150, T.cream)}${bauble(-110, 360, T.cream)}${bauble(20, 330, T.chestnut)}${bauble(120, 370, T.buff)}
  ${bauble(-170, 560, T.chestnut)}${bauble(-50, 520, T.buff)}${bauble(80, 560, T.cream)}${bauble(190, 540, T.chestnut)}</g>`;
