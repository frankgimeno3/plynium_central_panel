export type ServiceGroupDetailModel = {
    service_group_id: string;
    service_group_name: string;
    service_group_channel: string;
    tariff_price_eur?: number;
    service_specifications?: string;
    service_base_description?: string;
};

export type ServiceGroupServiceRow = {
    id_service: string;
    name: string;
    service_group_id?: string | null;
    tariff_price_eur?: number;
};
