export function formatStandardTariffEUR(value: unknown): string {
    const n = Number(value ?? 0);
    const safe = Number.isFinite(n) ? n : 0;
    return `${safe.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}
