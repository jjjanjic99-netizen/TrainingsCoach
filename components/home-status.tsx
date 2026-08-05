"use client";

/**
 * Dynamischer Statusblock auf der Startseite: Begrüssung, Renn-Countdown und
 * ein Setup-Fortschritt (Profil → Baseline → erste Einheit). Nutzt die
 * Datenschicht; solange nichts geladen ist, wird nichts angezeigt.
 */

import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Circle,
  Target,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui";
import { useProfile, useSessions, useLatestAssessment } from "@/lib/hooks/use-live-data";
import { formatDuration, weeksUntil } from "@/lib/format";

export function HomeStatus() {
  const profile = useProfile();
  const sessions = useSessions();
  const assessment = useLatestAssessment();

  // Warten, bis die Einheiten geladen sind (klarer Ladeindikator).
  if (sessions === undefined) {
    return (
      <Card>
        <CardBody className="pt-4 text-sm text-muted-foreground">Lädt…</CardBody>
      </Card>
    );
  }

  const profileDone = !!profile;
  const baselineDone = !!assessment;
  const loggedDone = sessions.length > 0;
  const allDone = profileDone && baselineDone && loggedDone;

  const weeks = weeksUntil(profile?.targetRaceDate);

  return (
    <div className="space-y-4">
      {/* Begrüssung + Ziel */}
      <Card>
        <CardBody className="pt-4">
          <h1 className="text-xl font-bold leading-snug">
            {profile?.name ? `Hallo, ${profile.name}!` : "Willkommen!"}
          </h1>

          {profile?.targetRaceDate && weeks != null ? (
            <div className="mt-3 flex items-start gap-3 rounded-xl bg-primary/10 p-3">
              <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div className="text-sm">
                <p className="font-semibold text-foreground">
                  {weeks >= 0
                    ? `Noch ca. ${weeks} Wochen bis zum Rennen`
                    : "Dein Renndatum liegt in der Vergangenheit"}
                </p>
                {profile.targetFinishSeconds != null ? (
                  <p className="text-muted-foreground">
                    Zielzeit: {formatDuration(profile.targetFinishSeconds)}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <Link
              href="/profil"
              className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-muted p-3 text-sm"
            >
              <span className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-5 w-5 text-primary" aria-hidden />
                Renndatum &amp; Zielzeit im Profil festlegen
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
            </Link>
          )}
        </CardBody>
      </Card>

      {/* Setup-Fortschritt */}
      {allDone ? (
        <Card>
          <CardBody className="flex items-center justify-between gap-3 pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-semibold">Startklar</p>
                <p className="text-xs text-muted-foreground">
                  {sessions.length} Einheiten geloggt.
                </p>
              </div>
            </div>
            <Link
              href="/fortschritt"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              Dashboard
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="pt-4">
            <p className="mb-2 text-sm font-semibold">Erste Schritte</p>
            <ul className="space-y-1">
              <SetupStep done={profileDone} href="/profil" label="Profil anlegen" />
              <SetupStep
                done={baselineDone}
                href="/baseline"
                label="Baseline-Assessment erfassen"
              />
              <SetupStep
                done={loggedDone}
                href="/training/neu"
                label="Erste Einheit loggen"
              />
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function SetupStep({
  done,
  href,
  label,
}: {
  done: boolean;
  href: string;
  label: string;
}) {
  const content = (
    <div className="flex items-center gap-3 py-2">
      {done ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      ) : (
        <Circle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <span
        className={
          done ? "text-sm text-muted-foreground line-through" : "text-sm font-medium"
        }
      >
        {label}
      </span>
      {!done ? (
        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" aria-hidden />
      ) : null}
    </div>
  );

  if (done) return <li>{content}</li>;
  return (
    <li>
      <Link href={href} className="block rounded-lg transition hover:bg-muted">
        {content}
      </Link>
    </li>
  );
}
