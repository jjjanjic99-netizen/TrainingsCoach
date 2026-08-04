import type { Metadata } from "next";
import { SettingsView } from "@/components/settings-view";

export const metadata: Metadata = { title: "Einstellungen" };

export default function EinstellungenPage() {
  return <SettingsView />;
}
