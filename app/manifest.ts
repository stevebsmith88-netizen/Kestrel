import type { MetadataRoute } from "next";

// What a phone reads when someone adds Kestrel to their home screen: the name under the icon and the icon itself (Steve, 20th November 2026).
// The pictures are Kestrel's own app icon (public/brand/kestrel-app-icon.png) flattened onto navy at 192 and 512 pixels, never redrawn.
// The full home screen app, with push alerts, is still to come (next tasks, item 16).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kestrel Eye Care Jobs",
    short_name: "Kestrel",
    description: "Canada-wide eye care job board.",
    start_url: "/",
    display: "standalone",
    background_color: "#1B2B4B",
    theme_color: "#1B2B4B",
    icons: [
      { src: "/brand/kestrel-app-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/kestrel-app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
