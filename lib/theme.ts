/**
 * Theme-Konstanten, die sowohl im Server-Layout (Inline-Skript) als auch
 * im Client-Provider gebraucht werden. Bewusst ohne "use client", damit der
 * String im Server-Component-Layout direkt eingebettet werden kann.
 */

export type ThemeMode = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "hyrox-coach:theme";

/**
 * Inline-Skript für den <head>: setzt die `.dark`-Klasse anhand von
 * localStorage/Systemeinstellung, bevor die Seite gerendert wird, und
 * verhindert so das kurze Aufblitzen des falschen Themes (FOUC).
 */
export const themeInitScript = `
(function () {
  try {
    var key = "${THEME_STORAGE_KEY}";
    var stored = localStorage.getItem(key) || "system";
    var dark = stored === "dark" ||
      (stored === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var root = document.documentElement;
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
  } catch (e) {}
})();
`;
