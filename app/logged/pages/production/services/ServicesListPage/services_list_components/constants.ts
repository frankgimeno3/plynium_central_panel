export type ServiceType = "newsletter" | "portal" | "magazine" | "other";
export type Specifity = "general" | "specific-related";

export const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: "newsletter", label: "Newsletter" },
  { value: "portal", label: "Portal" },
  { value: "magazine", label: "Magazine" },
  { value: "other", label: "Other" },
];

export const SPECIFITY_OPTIONS: { value: Specifity | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "general", label: "General" },
  { value: "specific-related", label: "Specific-related" },
];

export type ServiceListRow = {
  id_service: string;
  name: string;
  service_type?: string;
  specifity?: Specifity | string;
  tariff_price_eur: number;
  publication_date?: string;
};

export const ITEMS_PER_PAGE = 12;

export function specifityLabel(value?: string): string {
  if (value === "general") return "General";
  if (value === "specific-related") return "Specific-related";
  return "—";
}

export function specifitySortKey(value?: string): number {
  if (value === "general") return 0;
  if (value === "specific-related") return 1;
  return 2;
}
