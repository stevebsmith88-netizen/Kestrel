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
