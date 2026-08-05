import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Footprints } from "lucide-react";
import { PlanView } from "@/components/plan-view";

export const metadata: Metadata = { title: "Trainingsplan" };

export default function PlanPage() {
  return (
    <div className="space-y-6">
      <PlanView />

      <Link
        href="/lauf"
        className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold shadow-sm transition hover:border-primary/40"
      >
        <span className="flex items-center gap-3">
          <Footprints className="h-5 w-5 text-primary" aria-hidden />
          Lauf-Coaching &amp; Pace-Zonen
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
      </Link>
    </div>
  );
}
