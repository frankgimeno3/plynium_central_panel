export type PlannedPublication = {
  id_publication: string;
  edition_name?: string;
  theme?: string;
  publication_date?: string;
};

export type PublicationsListFilter = {
  id: string;
  edition: string;
  theme: string;
};
