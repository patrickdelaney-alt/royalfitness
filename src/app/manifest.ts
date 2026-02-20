import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RoyalWellness Beta",
    short_name: "RoyalWellness",
    description: "Track your workouts. Track your nutrition. Track your wellness.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafafa",
    theme_color: "#2563EB",
    icons: [
      {
        // Next.js serves icon.tsx at /icon — 512×512 PNG generated on demand
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // Same icon marked maskable so Android can apply its shape masks
        // (keep important content within the centre 80% — the crown is centred)
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
