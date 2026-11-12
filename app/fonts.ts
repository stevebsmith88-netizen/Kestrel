import type { CSSProperties } from "react";
import localFont from "next/font/local";

// The 4 brand fonts, loaded through Next's font loader from the same @fontsource files the site has always used (audit P1-12).
// The loader preloads them in the page head and draws the text first in a fallback that is resized to take up the same room,
// so nothing moves when the real font arrives. Only the basic Latin set is handled here, since that is almost every page. Accented
// letters outside it (Polish, Romanian, Vietnamese and other names) still come from the @fontsource files in app/fonts-other-letters.ts,
// which the browser fetches only when a page actually uses one of those letters.

// Each font gets the basic Latin range, exactly as @fontsource declares it, so the 2 sets of files never overlap. The loader only
// accepts values written out in full, so the range is repeated in each.

export const dmSerif = localFont({
  src: [{ path: "../node_modules/@fontsource/dm-serif-display/files/dm-serif-display-latin-400-normal.woff2", weight: "400", style: "normal" }],
  display: "swap",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
  adjustFontFallback: "Times New Roman",
});

export const sourceSerif = localFont({
  src: [{ path: "../node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-600-normal.woff2", weight: "600", style: "normal" }],
  display: "swap",
  // Only the original coming soon page uses it ("EYE CARE JOBS"), so other pages do not fetch it ahead of time.
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
  adjustFontFallback: "Times New Roman",
});

export const poppins = localFont({
  src: [{ path: "../node_modules/@fontsource/poppins/files/poppins-latin-400-normal.woff2", weight: "400", style: "normal" }],
  display: "swap",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
  adjustFontFallback: "Arial",
});

export const sourceSans = localFont({
  src: [
    { path: "../node_modules/@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@fontsource/source-sans-3/files/source-sans-3-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../node_modules/@fontsource/source-sans-3/files/source-sans-3-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
  adjustFontFallback: "Arial",
});

// The font stacks the stylesheet uses (var(--f-display) and so on): the preloaded Latin file first, then the @fontsource family for
// any other letters, then the resized fallback. The loader gives "'main', 'main Fallback'", and the @fontsource name goes between them.
function stack(font: { style: { fontFamily: string } }, fontsource: string) {
  const [main, ...fallback] = font.style.fontFamily.split(",").map((s) => s.trim());
  return [main, `"${fontsource}"`, ...fallback].join(", ");
}

export const fontVariables = {
  "--f-display": stack(dmSerif, "DM Serif Display"),
  "--f-serif": stack(sourceSerif, "Source Serif 4"),
  "--f-tag": stack(poppins, "Poppins"),
  "--f-sans": stack(sourceSans, "Source Sans 3"),
} as CSSProperties;
