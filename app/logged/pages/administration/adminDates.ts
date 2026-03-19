/** Shared date helpers for Administration pages: display and input as dd/mm/yyyy. */

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** First YYYY-MM-DD in a string (handles ISO datetimes). */
export function normalizeAdminDateToYMD(raw: unknown): string {
  if (raw == null) return "";
  const s = String(raw).trim();
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  return m ? m[1] : "";
}

/** Display calendar dates as dd/mm/yyyy. */
export function formatAdminDate(raw: unknown): string {
  const ymd = normalizeAdminDateToYMD(raw);
  if (!ymd) {
    const s = String(raw ?? "").trim();
    return s.length > 0 ? s : "—";
  }
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

export function ymdToDDMMYYYY(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d || y.length !== 4) return "";
  return `${d}/${m}/${y}`;
}

export function ddmmyyyyToYMD(s: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!match) return null;
  const dd = Number(match[1]);
  const mm = Number(match[2]);
  const year = Number(match[3]);
  if (year < 1000 || year > 9999) return null;
  const dt = new Date(year, mm - 1, dd);
  if (dt.getFullYear() !== year || dt.getMonth() !== mm - 1 || dt.getDate() !== dd)
    return null;
  return `${year}-${pad2(mm)}-${pad2(dd)}`;
}

export function maskDDMMYYYY(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  if (!digits) return "";
  if (digits.length <= 2) return dd;
  if (digits.length <= 4) return `${dd}/${mm}`;
  return `${dd}/${mm}/${yyyy}`;
}
