export type ServiceType = "newsletter" | "portal" | "magazine" | "other";

export type ServiceDetailModel = {
  id_service: string;
  name: string;
  tariff_price_eur?: number;
  service_price?: number;
  service_type?: ServiceType;
  service_description?: string;
  service_group_id?: string | null;
  service_group_name?: string | null;
  service_group_specifications?: string;
  service_group_base_description?: string;
};

export type EditFormState = {
  name: string;
  service_type: ServiceType | "";
  service_description: string;
  service_price: number;
};
