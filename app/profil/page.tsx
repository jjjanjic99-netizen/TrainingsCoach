import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ClipboardCheck, Settings } from "lucide-react";
import { ProfileForm } from "@/components/profile-form";
import { PersonalRecordsCard } from "@/components/personal-records-card";
import { SectionTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Profil" };

export default function ProfilPage() {
  return (
    <div className="space-y-6">
      <ProfileForm />

      <section className="space-y-2">
        <SectionTitle>Bestleistungen</SectionTitle>
        <PersonalRecordsCard />
      </section>

      <section className="space-y-2">
        <SectionTitle>Mehr</SectionTitle>
        <div className="space-y-3">
          <Link
            href="/baseline"
            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold shadow-sm transition hover:border-primary/40"
          >
            <span className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-primary" aria-hidden />
              Baseline-Assessment
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
          </Link>

          <Link
            href="/einstellungen"
            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold shadow-sm transition hover:border-primary/40"
          >
            <span className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-primary" aria-hidden />
              Einstellungen &amp; Datensicherung
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
