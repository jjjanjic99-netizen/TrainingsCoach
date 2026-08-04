import withSerwistInit from "@serwist/next";

/**
 * Serwist erzeugt aus `app/sw.ts` den Service Worker unter `public/sw.js`
 * und registriert ihn automatisch im Browser.
 *
 * Im Entwicklungsmodus wird der Service Worker deaktiviert, damit das
 * aggressive Caching die lokale Entwicklung (`npm run dev`) nicht stört.
 * Offline-Betrieb greift im Production-Build (`npm run build && npm start`)
 * bzw. im Deployment.
 */
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withSerwist(nextConfig);
