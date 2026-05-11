export type PublicationSummary = {
  publication_id: string;
  publication_edition_name: string;
  publication_status: string;
  magazine_id: string | null;
};

export type PreferentialPublicationDetailPageProps = {
  publicationId: string;
};
