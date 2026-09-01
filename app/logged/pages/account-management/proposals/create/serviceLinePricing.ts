import type { ServiceLine, ServiceLinePriceMode } from "./components/types";

export function computeCalculatedServiceTotal(
  units: number,
  unitPrice: number,
  discountPct: number
): number {
  const u = Math.max(0, Number(units) || 0);
  const p = Math.max(0, Number(unitPrice) || 0);
  const d = Math.max(0, Math.min(100, Number(discountPct) || 0));
  return Math.round(u * p * (1 - d / 100) * 100) / 100;
}

export function resolveUnitPrice(line: Pick<ServiceLine, "unit_price" | "price">): number {
  if (line.unit_price != null && Number.isFinite(Number(line.unit_price))) {
    return Number(line.unit_price);
  }
  return Number(line.price) || 0;
}

export function resolvePriceMode(line: Partial<ServiceLine>): ServiceLinePriceMode {
  const mode = line.price_mode;
  if (mode === "strikethrough" || mode === "free" || mode === "custom" || mode === "calculated") {
    return mode;
  }
  return "calculated";
}

export function getDisplayServiceTotal(line: ServiceLine): number {
  const unitPrice = resolveUnitPrice(line);
  const mode = resolvePriceMode(line);
  if (mode === "custom") {
    return Number(line.service_total_price) || 0;
  }
  return computeCalculatedServiceTotal(line.units, unitPrice, line.discount_pct);
}

/** Amount that contributes to proposal totals (0 for strikethrough / free). */
export function getContributingServiceTotal(line: ServiceLine): number {
  const mode = resolvePriceMode(line);
  if (mode === "strikethrough" || mode === "free") return 0;
  if (mode === "custom") return Math.max(0, Number(line.service_total_price) || 0);
  return computeCalculatedServiceTotal(line.units, resolveUnitPrice(line), line.discount_pct);
}

export function normalizeServiceLineFromApi(line: Partial<ServiceLine> & { price?: number }): ServiceLine {
  const unit_price = resolveUnitPrice(line as ServiceLine);
  const price_mode = resolvePriceMode(line);
  const units = Number(line.units) || 1;
  const discount_pct = Number(line.discount_pct) || 0;
  const calculated = computeCalculatedServiceTotal(units, unit_price, discount_pct);
  const service_total_price =
    price_mode === "custom" && line.service_total_price != null
      ? Number(line.service_total_price) || 0
      : calculated;

  return {
    lineId: String(line.lineId ?? ""),
    id_service: String(line.id_service ?? ""),
    description: String(line.description ?? ""),
    specifications: String(line.specifications ?? ""),
    units,
    discount_pct,
    unit_price,
    price: unit_price,
    price_mode,
    service_total_price,
    ...(line.publicationMonth != null ? { publicationMonth: line.publicationMonth } : {}),
    ...(line.publicationYear != null ? { publicationYear: line.publicationYear } : {}),
    ...(line.startDate ? { startDate: line.startDate } : {}),
    ...(line.endDate ? { endDate: line.endDate } : {}),
    ...(line.id_planned_publication ? { id_planned_publication: line.id_planned_publication } : {}),
    ...(line.magazinePageType ? { magazinePageType: line.magazinePageType } : {}),
    ...(line.magazineSlotKey ? { magazineSlotKey: line.magazineSlotKey } : {}),
    ...(line.preferential_slot_id ? { preferential_slot_id: line.preferential_slot_id } : {}),
    ...(line.position_in_magazine ? { position_in_magazine: line.position_in_magazine } : {}),
  };
}

export function applyServiceLinePatch(line: ServiceLine, patch: Partial<ServiceLine>): ServiceLine {
  const merged: ServiceLine = { ...line, ...patch };
  const unit_price = patch.unit_price != null ? Number(patch.unit_price) || 0 : resolveUnitPrice(merged);
  const price_mode = resolvePriceMode(merged);
  const units = Number(merged.units) || 0;
  const discount_pct = Number(merged.discount_pct) || 0;

  let next: ServiceLine = {
    ...merged,
    unit_price,
    price: unit_price,
    price_mode,
  };

  if (price_mode === "calculated") {
    next.service_total_price = computeCalculatedServiceTotal(units, unit_price, discount_pct);
  } else if (price_mode === "custom" && patch.price_mode === "custom" && patch.service_total_price == null) {
    next.service_total_price = computeCalculatedServiceTotal(units, unit_price, discount_pct);
    next.discount_pct = 0;
  } else if (price_mode !== "custom") {
    next.service_total_price = computeCalculatedServiceTotal(units, unit_price, discount_pct);
  }

  return next;
}

export function setServiceLinePriceMode(line: ServiceLine, mode: ServiceLinePriceMode): ServiceLine {
  if (mode === "custom") {
    const total = getDisplayServiceTotal(line);
    return applyServiceLinePatch(line, { price_mode: "custom", discount_pct: 0, service_total_price: total });
  }
  return applyServiceLinePatch(line, { price_mode: mode });
}
