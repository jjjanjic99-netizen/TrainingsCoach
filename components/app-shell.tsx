/**
 * App-Rahmen: obere Leiste, scrollbarer Inhalt, untere Tab-Leiste.
 * Der Inhalt erhält unten genügend Abstand, damit nichts hinter der
 * fixierten Tab-Leiste (inkl. Safe-Area) verschwindet.
 */

import { AppHeader } from "@/components/app-header";
import { TabBar } from "@/components/tab-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 pb-[calc(72px+env(safe-area-inset-bottom))] pt-4">
        {children}
      </main>
      <TabBar />
    </div>
  );
}
