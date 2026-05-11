"use client";

import { FC, use } from "react";
import { ServiceDetailPage } from "./ServiceDetailPage/ServiceDetailPage";

const ServiceDetailRoutePage: FC<{ params: Promise<{ id_service: string }> }> = ({ params }) => {
  const { id_service } = use(params);
  return <ServiceDetailPage serviceId={id_service} />;
};

export default ServiceDetailRoutePage;
