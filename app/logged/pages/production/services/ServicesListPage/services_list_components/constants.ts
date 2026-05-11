export type ServiceType = "newsletter" | "portal" | "magazine" | "other";

export const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: "newsletter", label: "Newsletter" },
  { value: "portal", label: "Portal" },
  { value: "magazine", label: "Magazine" },
  { value: "other", label: "Other" },
];

export type ServiceListRow = {
  id_service: string;
  name: string;
  service_type?: string;
  tariff_price_eur: number;
  publication_date?: string;
};

export const ITEMS_PER_PAGE = 12;
