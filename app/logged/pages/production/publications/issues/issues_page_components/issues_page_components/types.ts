export type PortalRow = { id: number; key: string; name: string };

export type PublicationDbRow = {
  publication_id: string;
  magazine_id: string | null;
  publication_year: number | null;
  publication_edition_name: string;
  magazine_general_issue_number: number | null;
  magazine_this_year_issue: number | null;
  publication_expected_publication_month: number | null;
  real_publication_month_date: string | null;
  publication_materials_deadline: string | null;
  is_special_edition: boolean;
  publication_theme: string;
  publication_status: "planned" | "draft" | "published" | string;
  publication_format: "flipbook" | "informer" | string;
  publication_main_image_url: string;
};

export type TabId = "development" | "forecasted" | "published" | "cancelled";

export type IssuesFilterState = { id: string; edition: string; magazine: string };
