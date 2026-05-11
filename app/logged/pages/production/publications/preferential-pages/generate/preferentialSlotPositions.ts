export const CANONICAL_PREFERENTIAL_POSITIONS = [
  "Cover page",
  "Inside Cover",
  "Preferential page 1",
  "Preferential page 2",
  "Preferential page 3",
  "Preferential page 4",
  "Preferential page 5",
  "Preferential page 6",
  "Preferential page 7",
  "Preferential page 8",
  "Preferential page 9",
  "End page",
] as const;

export type CanonicalPreferentialPosition = (typeof CANONICAL_PREFERENTIAL_POSITIONS)[number];

export function displayPreferentialPosition(position: string): string {
  const value = String(position ?? "").trim();
  if (value === "Cover page") return "Cover page";
  if (value === "Inside Cover") return "Inside cover";
  if (value === "End page") return "End page";
  const match = /^Preferential page (\d+)$/i.exec(value);
  if (match) return `Preferential page ${match[1]}`;
  return value || "—";
}

export function selectionKey(publicationId: string, position: string): string {
  return `${publicationId}::${position}`;
}
