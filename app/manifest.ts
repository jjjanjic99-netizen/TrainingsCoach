import type { MetadataRoute } from "next";

/**
 * Web-App-Manifest (wird von Next unter `/manifest.webmanifest` ausgeliefert).
 *
 * Sorgt zusammen mit den Apple-Meta-Tags (siehe `app/layout.tsx`) dafür, dass
 * die App über „Zum Home-Bildschirm hinzufügen" wie eine native App im
 * Vollbild (`standalone`) startet.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hyrox Coach",
    short_name: "Hyrox Coach",
    description:
      "Persönlicher Hyrox-Trainings-Coach: Training tracken, Einheiten planen und den Fortschritt zum Renntag messen.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1220",
    theme_color: "#0b1220",
    lang: "de-CH",
    dir: "ltr",
    categories: ["health", "fitness", "sports"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
