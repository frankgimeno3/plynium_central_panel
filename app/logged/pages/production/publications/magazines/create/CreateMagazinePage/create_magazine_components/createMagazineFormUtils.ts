import type { FormState } from "./types";

export function generateNextMagazineId(existingIds: string[]): string {
  const prefix = "mag-";
  const numericIds = existingIds
    .map((id) => {
      const match = (id || "").replace(prefix, "").match(/^(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const max = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  const next = (max + 1).toString().padStart(3, "0");
  return `${prefix}${next}`;
}

export const initialForm: FormState = {
  id_magazine: "",
  name: "",
  description: "",
  starting_year: "",
  periodicity: "",
  subscriber_number: "",
  num_issues: 0,
  issues: [],
  doNotAutoCreateNextYearIssues: false,
};
