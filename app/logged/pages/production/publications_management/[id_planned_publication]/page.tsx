"use client";

import { FC, use } from "react";
import PlannedPublicationDetailPage from "./PlannedPublicationDetailPage/PlannedPublicationDetailPage";

const PlannedPublicationDetailRoutePage: FC<{
  params: Promise<{ id_planned_publication: string }>;
}> = ({ params }) => {
  const { id_planned_publication } = use(params);
  return <PlannedPublicationDetailPage idPlannedPublication={id_planned_publication} />;
};

export default PlannedPublicationDetailRoutePage;
