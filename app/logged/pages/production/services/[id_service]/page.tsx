"use client";

import React, { FC, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import servicesData from "@/app/contents/services.json";

type Service = {
  id_service: string;
  name: string;
  tariff_price_eur: number;
  publication_date?: string;
};

const ServiceDetailPage: FC<{ params: Promise<{ id_service: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_service } = use(params);
  const service = (servicesData as Service[]).find((s) => s.id_service === id_service);
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    if (service) {
      setPageMeta({
        pageTitle: `Service: ${service.name?.replace(/_/g, " ") ?? id_service}`,
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/projects" },
          { label: "Services", href: "/logged/pages/production/services" },
          { label: service.name?.replace(/_/g, " ") ?? id_service },
        ],
        buttons: [{ label: "Back to Services", href: "/logged/pages/production/services" }],
      });
    } else {
      setPageMeta({
        pageTitle: "Service not found",
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/projects" },
          { label: "Services", href: "/logged/pages/production/services" },
        ],
        buttons: [{ label: "Back to Services", href: "/logged/pages/production/services" }],
      });
    }
  }, [setPageMeta, service, id_service]);

  if (!service) {
    return (
      <>
        <PageContentSection>
          <p className="text-gray-500">Service not found.</p>
        </PageContentSection>
      </>
    );
  }

  const breadcrumbs = [
    { label: "Production", href: "/logged/pages/production/projects" },
    { label: "Services", href: "/logged/pages/production/services" },
    { label: service.name?.replace(/_/g, " ") ?? id_service },
  ];

  return (
    <>
      <PageContentSection>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">ID</p>
            <p className="font-medium">{service.id_service}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Name</p>
            <p className="font-medium">{service.name?.replace(/_/g, " ")}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Tariff price (€)</p>
            <p className="font-medium">{service.tariff_price_eur?.toLocaleString()}</p>
          </div>
          {"publication_date" in service && service.publication_date && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Publication date</p>
              <p className="font-medium">{service.publication_date}</p>
            </div>
          )}
        </div>
      </PageContentSection>
    </>
  );
};

export default ServiceDetailPage;
