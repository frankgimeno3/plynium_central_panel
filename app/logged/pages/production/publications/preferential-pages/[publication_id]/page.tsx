"use client";

import { FC, use } from "react";
import { PreferentialPublicationDetailPage } from "./PreferentialPublicationDetailPage/PreferentialPublicationDetailPage";

const PreferentialPublicationRoutePage: FC<{ params: Promise<{ publication_id: string }> }> = ({
  params,
}) => {
  const { publication_id } = use(params);
  return <PreferentialPublicationDetailPage publicationId={publication_id} />;
};

export default PreferentialPublicationRoutePage;
