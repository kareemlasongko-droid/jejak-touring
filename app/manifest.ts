import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JejakTouring — Pantau perjalanan komunitas",
    short_name: "JejakTouring",
    description: "Bagikan perjalanan mobil secara live kepada komunitas dan keluarga.",
    start_url: "/",
    display: "standalone",
    background_color: "#11120f",
    theme_color: "#f7c948",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
