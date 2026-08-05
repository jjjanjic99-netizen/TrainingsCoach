import type { Metadata } from "next";
import { SessionForm } from "@/components/session-form";

export const metadata: Metadata = { title: "Neue Einheit" };

export default function NeueEinheitPage() {
  return (
    <div className="space-y-4">
      <h1 className="px-1 text-lg font-bold">Neue Einheit</h1>
      <SessionForm />
    </div>
  );
}
