import type { CategoryItem } from "./types";

export function normalizeCategoriesList(list: unknown[]): CategoryItem[] {
  return list
    .filter((c) => c != null && typeof c === "object")
    .map((c) => {
      const row = c as {
        category_id?: unknown;
        category_name?: unknown;
        portals_array?: unknown;
      };
      return {
        id_category: String(row.category_id ?? ""),
        name: String(row.category_name ?? ""),
        portals_array: Array.isArray(row.portals_array) ? row.portals_array : [],
      };
    });
}
