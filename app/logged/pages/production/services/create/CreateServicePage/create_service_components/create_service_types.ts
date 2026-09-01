export type Step = 1 | 2 | 3 | 4;
export type Channel = "dem" | "portal" | "magazine";
export type Specifity = "general" | "specific-related";

export type GeneralServiceRow = {
  service_id: string;
  service_full_name: string;
  service_channel: Channel;
  service_unit_price?: number;
  tariff_price_eur?: number;
  service_description?: string;
  service_unit_specifications?: string;
  specifity?: Specifity;
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
  created_from_other: boolean;
  service_channel: Channel | "";
  parent_service_id: string;
  custom: CustomState | null;
  service_description: string;
  service_unit_specifications: string;
  service_unit_price: number;
  final_service_name: string;
};

export const initialForm: FormState = {
  id_service: "",
  created_from_other: false,
  service_channel: "",
  parent_service_id: "",
  custom: null,
  service_description: "",
  service_unit_specifications: "",
  service_unit_price: 0,
  final_service_name: "",
};
