"use client";

import React, { FC, use, useEffect } from "react";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import servicesData from "@/app/contents/services.json";

type ServiceType = "newsletter" | "portal" | "magazine" | "other";

type Service = {
  id_service: string;
  name: string;
  tariff_price_eur?: number;
  service_price?: number;
  service_type?: ServiceType;
  service_description?: string;
  publication_date?: string;
};

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: "newsletter", label: "Newsletter" },
  { value: "portal", label: "Portal" },
  { value: "magazine", label: "Magazine" },
  { value: "other", label: "Other" },
];

function formatPublicationDate(isoDate: string | undefined): string {
  if (!isoDate) return "—";
  const d = new Date(isoDate + "T12:00:00");
  if (Number.isNaN(d.getTime())) return isoDate;
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
}

const ServiceDetailPage: FC<{ params: Promise<{ id_service: string }> }> = ({ params }) => {
  const { id_service } = use(params);
  const service = (servicesData as Service[]).find((s) => s.id_service === id_service);
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    if (service) {
      setPageMeta({
        pageTitle: `Service: ${service.name?.replace(/_/g, " ") ?? id_service}`,
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Services", href: "/logged/pages/production/services" },
          { label: service.name?.replace(/_/g, " ") ?? id_service },
        ],
        buttons: [
          { label: "Back to Services", href: "/logged/pages/production/services" },
          { label: "Create Service", href: "/logged/pages/production/services/create" },
        ],
      });
    } else {
      setPageMeta({
        pageTitle: "Service not found",
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Services", href: "/logged/pages/production/services" },
        ],
        buttons: [{ label: "Back to Services", href: "/logged/pages/production/services" }],
      });
    }
  }, [setPageMeta, service, id_service]);

  if (!service) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-center text-gray-500">Service not found.</div>
          </div>
        </div>
      </PageContentSection>
    );
  }

  const price = service.tariff_price_eur ?? service.service_price ?? null;
  const serviceTypeLabel =
    service.service_type != null
      ? SERVICE_TYPES.find((t) => t.value === service.service_type)?.label ?? service.service_type
      : "—";

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
          <p className="text-sm font-semibold text-gray-700 mb-4">Service details</p>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Service ID</dt>
              <dd className="font-medium font-mono text-gray-900">{service.id_service}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Name</dt>
              <dd className="font-medium text-gray-900">{service.name?.replace(/_/g, " ") ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Service type</dt>
              <dd className="font-medium text-gray-900">{serviceTypeLabel}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Description</dt>
              <dd className="font-medium text-gray-900 whitespace-pre-wrap">
                {service.service_description?.trim() ? service.service_description : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Price (€)</dt>
              <dd className="font-medium text-gray-900">
                {price != null ? Number(price).toLocaleString() : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Publication date</dt>
              <dd className="font-medium text-gray-900">{formatPublicationDate(service.publication_date)}</dd>
            </div>
          </dl>
            </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default ServiceDetailPage;
