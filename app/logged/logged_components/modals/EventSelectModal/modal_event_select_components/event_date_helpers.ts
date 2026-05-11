/** Parse dd/mm/yyyy or d/m/yyyy to YYYY-MM-DD, or null if invalid */
export function parseDdMmYyyy(input: string): string | null {
  const t = input.trim().replace(/\s/g, "");
  if (!t) return null;
  const parts = t.split("/");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map((p) => parseInt(p, 10));
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  if (y < 100) return null;
  const year = y < 1000 ? 2000 + y : y;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const lastDay = new Date(year, m, 0).getDate();
  if (d > lastDay) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(m)}-${pad(d)}`;
}

/** Format YYYY-MM-DD to dd/mm/yyyy for display */
export function toDdMmYyyy(apiDate: string): string {
  if (!apiDate || apiDate.length < 10) return "";
  const [y, m, d] = apiDate.split("T")[0].split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

export function formatIsoDateDdMmYy(d: string | undefined): string {
  if (!d) return "—";
  const s = String(d).split("T")[0];
  if (!s || s.length < 10) return d;
  const [y, m, day] = s.split("-");
  return `${day}/${m}/${y}`;
}
