import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// Service-Worker-Quelle für Serwist.
// Wird beim Build zu `public/sw.js` kompiliert und automatisch registriert.
// Aufgabe: App-Shell und statische Assets vorab cachen (Precaching) sowie
// Routen/Assets zur Laufzeit cachen -> App startet und funktioniert offline.

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Von Serwist zur Build-Zeit injizierte Liste der vorzucachenden Assets.
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
