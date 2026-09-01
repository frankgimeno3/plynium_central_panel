export type ServiceType = "newsletter" | "portal" | "magazine" | "other";
export type Specifity = "general" | "specific-related";

export type RelatedServiceSummary = {
  service_id: string;
  id_service: string;
  name: string;
  service_full_name?: string;
  service_channel?: string;
  specifity?: Specifity | string;
  related_to_other_services?: string | null;
  tariff_price_eur?: number;
  service_type?: ServiceType;
};

export type ServiceDetailModel = {
  id_service: string;
  name: string;
  tariff_price_eur?: number;
  service_price?: number;
  service_type?: ServiceType;
  service_channel?: string;
  specifity?: Specifity | string;
  related_to_other_services?: string | null;
  service_description?: string;
  service_unit_specifications?: string;
  parent_service?: RelatedServiceSummary | null;
  related_services?: RelatedServiceSummary[];
  // Legacy aliases
  service_group_id?: string | null;
  service_group_name?: string | null;
  service_group_specifications?: string;
  service_group_base_description?: string;
};

export type EditFormState = {
  name: string;
  service_type: ServiceType | "";
  service_description: string;
  service_unit_specifications: string;
  service_price: number;
};
