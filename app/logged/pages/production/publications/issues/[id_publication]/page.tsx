"use client";

import { FC, use } from "react";
import { PublicationIssueDetailPage } from "./publication_issue_components/PublicationIssueDetailPage";

const PublicationDetailRoutePage: FC<{ params: Promise<{ id_publication: string }> }> = ({ params }) => {
  const { id_publication } = use(params);
  return <PublicationIssueDetailPage publicationId={id_publication} />;
};

export default PublicationDetailRoutePage;
