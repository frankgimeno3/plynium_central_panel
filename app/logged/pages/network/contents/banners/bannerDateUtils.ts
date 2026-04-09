/** YYYY-MM-DD helpers for banner start/end (manual dd/mm/yyyy entry). */

export function todayYmd(): string {
    return new Date().toISOString().slice(0, 10);
}

export function addOneYearYmd(ymd: string): string {
    const [y, m, d] = ymd.split('-').map((x) => parseInt(x, 10));
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCFullYear(dt.getUTCFullYear() + 1);
    return dt.toISOString().slice(0, 10);
}

export function splitYmd(ymd: string): { dd: string; mm: string; yyyy: string } {
    const p = ymd.trim().split('-');
    if (p.length !== 3) return { dd: '', mm: '', yyyy: '' };
    return { yyyy: p[0], mm: p[1], dd: p[2] };
}

function pad2(n: number): string {
    return String(n).padStart(2, '0');
}

/** Returns YYYY-MM-DD or null if invalid. */
export function ymdFromParts(ddStr: string, mmStr: string, yyyyStr: string): string | null {
    const dd = parseInt(ddStr, 10);
    const mm = parseInt(mmStr, 10);
    const yyyy = parseInt(yyyyStr, 10);
    if (Number.isNaN(dd) || Number.isNaN(mm) || Number.isNaN(yyyy)) return null;
    if (yyyy < 1970 || yyyy > 2100) return null;
    if (mm < 1 || mm > 12) return null;
    const d = new Date(Date.UTC(yyyy, mm - 1, dd));
    if (d.getUTCFullYear() !== yyyy || d.getUTCMonth() !== mm - 1 || d.getUTCDate() !== dd) return null;
    return `${yyyy}-${pad2(mm)}-${pad2(dd)}`;
}
