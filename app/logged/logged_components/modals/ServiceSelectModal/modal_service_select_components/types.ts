export interface ServiceGroupRow {
  service_group_id: string;
  service_group_name: string;
  shown_name?: string;
  service_group_channel: string;
  tariff_price_eur?: number;
}

export interface ServiceEntity {
  id_service: string;
  name: string;
  display_name?: string;
  shown_name?: string;
  description: string;
  service_unit_specifications?: string;
  tariff_price_eur: number;
  unit?: string;
  service_portal?: number | null;
  service_group_id?: string | null;
  related_to_other_services?: string | null;
  service_channel?: string;
  service_group_channel?: string;
  service_type?: string;
  specifity?: string;
}

export interface ServiceRow {
  id_service: string;
  name: string;
  display_name?: string;
  shown_name?: string;
  description: string;
  service_unit_specifications?: string;
  tariff_price_eur: number;
  unit?: string;
  service_group_id?: string | null;
  related_to_other_services?: string | null;
  service_channel?: string;
  service_type?: string;
}

export type PortalOption = { id: number; key: string; name: string };
export type MagazineOption = { id_magazine: string; name: string };

export type PublicationEditionRow = {
  id_publication: string;
  edition_name?: string;
  publication_edition_name?: string;
  publication_date?: string;
  theme?: string;
  year?: number;
  issue_number?: number;
  real_publication_month_date?: string | null;
};

/** Extra data per service type, passed on confirm */
export type ServiceExtra =
  | { type: "newsletter"; publicationMonth: number; publicationYear: number }
  | { type: "portal_article" }
  | { type: "portal_banner"; startDate: string; endDate: string; calculatedPrice: number }
  | { type: "portal_premium_profile"; startDate: string; endDate: string; calculatedPrice: number }
  | { type: "magazine_article"; id_planned_publication: string; publicationLabel: string; publicationDateIso?: string }
  | {
      type: "magazine_advertisement";
      id_planned_publication: string;
      publicationLabel: string;
      pageType: string;
      slotKey: string;
      publicationDateIso?: string;
      preferential_slot_id?: string;
      position_in_magazine?: string;
    }
  | {
      type: "magazine_preferential";
      id_planned_publication: string;
      publicationLabel: string;
      publicationDateIso?: string;
      preferential_slot_id: string;
      position_in_magazine: string;
      pageType?: string;
      slotKey?: string;
    };

export type ServiceLineDraft = {
  description: string;
  specifications: string;
  units: number;
  unit_price: number;
  discount_pct: number;
};

export interface ServiceSelectModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (service: ServiceRow, extra?: ServiceExtra, lineDraft?: ServiceLineDraft) => void;
}
