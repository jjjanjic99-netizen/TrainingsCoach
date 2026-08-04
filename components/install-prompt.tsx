"use client";

/**
 * Onboarding-Hinweis „Zum Home-Bildschirm hinzufügen".
 *
 * iOS/Safari zeigt keinen automatischen Install-Prompt. Deshalb erklärt
 * dieser Hinweis den Weg über das Teilen-Menü. Er wird ausgeblendet, wenn:
 *  - die App bereits im Standalone-Modus läuft (bereits installiert),
 *  - der Hinweis manuell geschlossen wurde (localStorage).
 *
 * Auf Android/Chrome wird – falls verfügbar – das `beforeinstallprompt`-
 * Event genutzt, um einen echten Installieren-Button anzubieten.
 */

import { useEffect, useState } from "react";
import { Share, SquarePlus, X, Download } from "lucide-react";
import { Card } from "@/components/ui";

const DISMISS_KEY = "hyrox-coach:install-hint-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mql = window.matchMedia("(display-mode: standalone)").matches;
  // iOS-Safari-spezifisches Flag
  const iosStandalone =
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return mql || iosStandalone;
}

function detectIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const iOS = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ gibt sich als „Mac" aus -> über Touch erkennen
  const iPadOS = ua.includes("Mac") && "ontouchend" in document;
  return iOS || iPadOS;
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (detectStandalone()) return; // bereits installiert -> nichts anzeigen
    if (localStorage.getItem(DISMISS_KEY) === "1") return; // manuell geschlossen

    setIsIOS(detectIOS());
    setVisible(true);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  };

  if (!visible) return null;

  return (
    <Card className="relative overflow-hidden border-primary/30 bg-primary/5">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Hinweis schliessen"
        className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>

      <div className="flex items-start gap-3 p-4 pr-12">
        <div className="mt-0.5 rounded-xl bg-primary/15 p-2 text-primary" aria-hidden>
          <SquarePlus className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Als App installieren</h2>

          {isIOS ? (
            <p className="mt-1 text-sm text-muted-foreground">
              In Safari das Teilen-Menü{" "}
              <Share className="mx-0.5 -mt-0.5 inline h-4 w-4" aria-hidden /> öffnen
              und{" "}
              <span className="font-medium text-foreground">
                „Zum Home-Bildschirm“
              </span>{" "}
              wählen. Danach startet Hyrox Coach im Vollbild und funktioniert
              offline.
            </p>
          ) : deferred ? (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">
                Installiere die App für Vollbild und Offline-Betrieb.
              </p>
              <button
                type="button"
                onClick={install}
                className="mt-3 inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                <Download className="h-4 w-4" aria-hidden />
                Installieren
              </button>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Über das Browser-Menü{" "}
              <span className="font-medium text-foreground">
                „Zum Startbildschirm hinzufügen“
              </span>{" "}
              wählen – dann läuft Hyrox Coach im Vollbild und offline.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
