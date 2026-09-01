export type MagazineServiceAvailabilityStatus = "available" | "offered" | "sold";

export function magazineServiceAvailabilityFromMap(
  byServiceId: Record<string, "sold" | "offered"> | undefined,
  serviceId: string | null | undefined
): MagazineServiceAvailabilityStatus {
  const sid = String(serviceId ?? "").trim();
  if (!sid || !byServiceId) return "available";
  const st = byServiceId[sid];
  if (st === "sold") return "sold";
  if (st === "offered") return "offered";
  return "available";
}

export function magazineServiceAvailabilityLabel(status: MagazineServiceAvailabilityStatus): string {
  switch (status) {
    case "sold":
      return "Sold";
    case "offered":
      return "Offered";
    default:
      return "Available";
  }
}

export function isMagazineServiceSelectable(status: MagazineServiceAvailabilityStatus): boolean {
  return status === "available" || status === "offered";
}

export function magazineServiceAvailabilityClass(status: MagazineServiceAvailabilityStatus): string {
  if (status === "sold") {
    return "border-red-300 bg-red-50 text-red-900 cursor-not-allowed opacity-90";
  }
  if (status === "offered") {
    return "border-amber-300 bg-amber-50 text-amber-900 hover:border-amber-400";
  }
  return "border-emerald-300 bg-emerald-50 text-emerald-900 hover:border-emerald-400";
}
