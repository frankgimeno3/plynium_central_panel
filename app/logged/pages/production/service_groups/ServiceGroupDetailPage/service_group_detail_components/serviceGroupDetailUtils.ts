export function parseStandardTariffEUR(s: string): number {
    const n = Number(String(s).trim().replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : 0;
}
