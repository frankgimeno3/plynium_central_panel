"use client";

import { FC, use } from "react";
import { ServiceGroupDetailPage } from "../ServiceGroupDetailPage/ServiceGroupDetailPage";

const ServiceGroupDetailRoutePage: FC<{ params: Promise<{ service_group_id: string }> }> = ({ params }) => {
    const { service_group_id } = use(params);
    return <ServiceGroupDetailPage serviceGroupId={service_group_id} />;
};

export default ServiceGroupDetailRoutePage;
