export type PublicationsListSubTab = "forecasted" | "expired";

export type PublicationRow = {
  id_publication: string;
  publication_status: string;
  publication_format: string;
  magazine_id: string;
  publication_year: number | null;
  magazine_this_year_issue: number | null;
  magazine_general_issue_number: number | null;
  publication_expected_publication_month: number | null;
  publication_theme: string;
  is_special_edition: boolean;
  publication_edition_name: string;
  real_publication_month_date: string | null;
};
