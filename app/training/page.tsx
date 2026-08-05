import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Upload } from "lucide-react";
import { SectionTitle } from "@/components/ui";
import { AddSessionButton, SessionList } from "@/components/session-list";

export const metadata: Metadata = { title: "Training" };

export default function TrainingPage() {
  return (
    <div className="space-y-6">
      <AddSessionButton />

      <Link
        href="/import"
        className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold shadow-sm transition hover:border-primary/40"
      >
        <span className="flex items-center gap-3">
          <Upload className="h-5 w-5 text-primary" aria-hidden />
          Watch-Daten importieren (CSV/JSON)
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
      </Link>

      <section className="space-y-2">
        <SectionTitle>Verlauf</SectionTitle>
        <SessionList />
      </section>
    </div>
  );
}
