/**
 * Kleiner Helfer zum bedingten Zusammenfügen von Klassennamen.
 * (Bewusst ohne Zusatz-Abhängigkeit gehalten.)
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
