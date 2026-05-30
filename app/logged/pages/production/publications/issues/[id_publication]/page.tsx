"use client";

import { FC, Suspense, use } from "react";
import { PublicationIssueDetailPage } from "./publication_issue_components/PublicationIssueDetailPage";

const PublicationDetailRoutePageContent: FC<{ publicationId: string }> = ({ publicationId }) => {
  return <PublicationIssueDetailPage publicationId={publicationId} />;
};

const PublicationDetailRoutePage: FC<{ params: Promise<{ id_publication: string }> }> = ({ params }) => {
  const { id_publication } = use(params);
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading issue…</div>}>
      <PublicationDetailRoutePageContent publicationId={id_publication} />
    </Suspense>
  );
};

export default PublicationDetailRoutePage;
