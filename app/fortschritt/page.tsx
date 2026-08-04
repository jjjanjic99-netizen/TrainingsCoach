import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";

export const metadata: Metadata = { title: "Fortschritt" };

export default function FortschrittPage() {
  return <Dashboard />;
}
