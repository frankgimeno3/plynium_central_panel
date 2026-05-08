"use client";

import { FC, use } from "react";
import { PublicationIssueDetailPage } from "../../[id_publication]/PublicationIssueDetailPage";

const PublicationIssueUnderIssuesRoutePage: FC<{ params: Promise<{ publication_id: string }> }> = ({
  params,
}) => {
  const { publication_id } = use(params);
  return <PublicationIssueDetailPage publicationId={publication_id} />;
};

export default PublicationIssueUnderIssuesRoutePage;
