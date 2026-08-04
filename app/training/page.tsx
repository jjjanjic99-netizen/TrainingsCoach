import type { Metadata } from "next";
import { SectionTitle } from "@/components/ui";
import { AddSessionButton, SessionList } from "@/components/session-list";

export const metadata: Metadata = { title: "Training" };

export default function TrainingPage() {
  return (
    <div className="space-y-6">
      <AddSessionButton />

      <section className="space-y-2">
        <SectionTitle>Verlauf</SectionTitle>
        <SessionList />
      </section>
    </div>
  );
}
