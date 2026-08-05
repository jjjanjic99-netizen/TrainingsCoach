import type { Metadata } from "next";
import { SessionForm } from "@/components/session-form";

export const metadata: Metadata = { title: "Einheit bearbeiten" };

export default function EinheitBearbeitenPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);

  return (
    <div className="space-y-4">
      <h1 className="px-1 text-lg font-bold">Einheit bearbeiten</h1>
      {Number.isNaN(id) ? (
        <p className="px-1 text-sm text-muted-foreground">Ungültige Einheit.</p>
      ) : (
        <SessionForm sessionId={id} />
      )}
    </div>
  );
}
