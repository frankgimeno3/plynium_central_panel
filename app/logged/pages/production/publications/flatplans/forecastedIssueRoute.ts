/** Encode forecasted issue route id: magazine + year + issue number (no flatplan yet). */
export function encodeForecastedIssueId(id_magazine: string, year: number, issue_number: number): string {
  return `${encodeURIComponent(id_magazine)}___${year}___${issue_number}`;
}

export type DecodedForecastedIssueId = {
  id_magazine: string;
  year: number;
  issue_number: number;
};

export function decodeForecastedIssueId(id: string): DecodedForecastedIssueId | null {
  const parts = id.split("___");
  if (parts.length !== 3) return null;
  const id_magazine = decodeURIComponent(parts[0]);
  const year = parseInt(parts[1], 10);
  const issue_number = parseInt(parts[2], 10);
  if (!id_magazine || Number.isNaN(year) || Number.isNaN(issue_number)) return null;
  return { id_magazine, year, issue_number };
}
