import type { Metadata } from "next";
import { ReadinessView } from "@/components/readiness-view";

export const metadata: Metadata = { title: "Readiness" };

export default function ReadinessPage() {
  return (
    <div className="space-y-4">
      <h1 className="px-1 text-lg font-bold">Recovery &amp; Readiness</h1>
      <ReadinessView />
    </div>
  );
}
