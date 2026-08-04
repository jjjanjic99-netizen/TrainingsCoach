"use client";

/**
 * Theme-Verwaltung (hell/dunkel) ohne Zusatz-Abhängigkeit.
 *
 * - Modus "system" folgt der Systemeinstellung, "light"/"dark" erzwingen.
 * - Persistiert in localStorage unter THEME_STORAGE_KEY.
 * - Setzt/entfernt die `.dark`-Klasse auf <html> (siehe Tailwind darkMode).
 *
 * Das Flackern beim ersten Laden verhindert ein Inline-Skript im <head>
 * (siehe `themeInitScript` unten), das die Klasse setzt, bevor React lädt.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { THEME_STORAGE_KEY, type ThemeMode } from "@/lib/theme";

export type { ThemeMode };

interface ThemeContextValue {
  /** Gewählter Modus. */
  mode: ThemeMode;
  /** Tatsächlich angewandtes Theme (aufgelöstes "system"). */
  resolved: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(mode: ThemeMode): "light" | "dark" {
  const resolved = mode === "system" ? (systemPrefersDark() ? "dark" : "light") : mode;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("dark");

  // Initial aus localStorage lesen (Client).
  useEffect(() => {
    const stored = (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode) || "system";
    setModeState(stored);
    setResolved(applyTheme(stored));
  }, []);

  // Auf Systemänderungen reagieren, wenn Modus "system".
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(applyTheme("system"));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    localStorage.setItem(THEME_STORAGE_KEY, next);
    setModeState(next);
    setResolved(applyTheme(next));
  }, []);

  const value = useMemo(
    () => ({ mode, resolved, setMode }),
    [mode, resolved, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme muss innerhalb von <ThemeProvider> genutzt werden.");
  return ctx;
}
