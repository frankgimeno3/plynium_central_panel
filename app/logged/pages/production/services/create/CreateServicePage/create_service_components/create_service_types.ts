export type Step = 1 | 2 | 3 | 4;
export type Channel = "dem" | "portal" | "magazine";

export type ServiceGroupRow = {
  service_group_id: string;
  service_group_name: string;
  service_group_channel: Channel;
  tariff_price_eur?: number;
  service_specifications?: string;
  service_base_description?: string;
};

export type PortalRow = { id: number; name: string };
export type MagazineRow = { id_magazine: string; name: string };
export type PublicationRow = {
  id_publication: string;
  edition_name?: string;
  publication_edition_name?: string;
  publication_year?: number | null;
};
export type CampaignRow = { id: string; name: string };

export type CustomState =
  | {
      channel: "dem";
      publicationMonth: string;
      publicationYear: string;
      portalId: string;
      campaignId: string;
      campaignName: string;
    }
  | { channel: "portal"; portalId: string; portalName: string }
  | {
      channel: "magazine";
      magazineId: string;
      magazineName: string;
      publicationYear: string;
      publicationId: string;
      publicationEditionName: string;
    };

export type FormState = {
  id_service: string;
  service_group_channel: Channel | "";
  service_group_id: string;
  custom: CustomState | null;
  service_description: string;
  service_unit_specifications: string;
  final_service_name: string;
};

export const initialForm: FormState = {
  id_service: "",
  service_group_channel: "",
  service_group_id: "",
  custom: null,
  service_description: "",
  service_unit_specifications: "",
  final_service_name: "",
};
