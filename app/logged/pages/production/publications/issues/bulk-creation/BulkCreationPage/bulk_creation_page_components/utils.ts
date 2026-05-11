import type { Magazine } from "@/app/contents/interfaces";

export function normalizeMagazines(data: unknown): Magazine[] {
  if (Array.isArray(data)) return data as Magazine[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: Magazine[] }).data;
  }
  return [];
}
