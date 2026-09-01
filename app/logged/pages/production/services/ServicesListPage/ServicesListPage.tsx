"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ServiceService } from "@/app/service/ServiceService";

import { ServiceTypeFilterTabs } from "./_tabs/ServiceTypeFilterTabs";
import { ITEMS_PER_PAGE, SERVICE_TYPES, specifitySortKey, type ServiceListRow, type ServiceType } from "./services_list_components/constants";
import type { ServicesListFilterState } from "./services_list_components/ServicesListFilters";
import { ServicesListFilters } from "./services_list_components/ServicesListFilters";
import { ServicesListInfoNote } from "./services_list_components/ServicesListInfoNote";
import { ServicesListPagination } from "./services_list_components/ServicesListPagination";
import { ServicesListTable } from "./services_list_components/ServicesListTable";

const ServicesListPage: FC = () => {
  const router = useRouter();
  const [all, setAll] = useState<ServiceListRow[]>([]);
  useEffect(() => {
    ServiceService.getAllServices()
      .then((list) => setAll(Array.isArray(list) ? list : []))
      .catch(() => setAll([]));
  }, []);
  const [filter, setFilter] = useState<ServicesListFilterState>({ id: "", name: "", hasPublicationDate: "", specifity: "" });
  const [activeServiceType, setActiveServiceType] = useState<string>("");

  const serviceTypeLabel = (serviceType?: string) => {
    if (!serviceType) return "—";
    return SERVICE_TYPES.find((t) => t.value === (serviceType as ServiceType))?.label ?? serviceType;
  };

  const serviceTypeTabs = useMemo(() => {
    const existingValues = Array.from(new Set(all.map((s) => (s.service_type ?? "").toString()).filter(Boolean)));
    const baseTabs = SERVICE_TYPES.map((t) => ({ value: t.value, label: t.label }));
    const extraValues = existingValues
      .filter((v) => !SERVICE_TYPES.some((t) => t.value === v))
      .sort((a, b) => a.localeCompare(b));
    const extraTabs = extraValues.map((v) => ({ value: v, label: v }));

    return [{ value: "", label: "All" }, ...baseTabs, ...extraTabs];
  }, [all]);

  const filtered = useMemo(() => {
    let list = [...all];
    if (activeServiceType) list = list.filter((s) => (s.service_type ?? "") === activeServiceType);
    if (filter.specifity) list = list.filter((s) => (s.specifity ?? "") === filter.specifity);
    if (filter.id) list = list.filter((s) => s.id_service.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.name) list = list.filter((s) => s.name?.toLowerCase().includes(filter.name.toLowerCase()));
    if (filter.hasPublicationDate === "yes") list = list.filter((s) => "publication_date" in s && s.publication_date);
    if (filter.hasPublicationDate === "no")
      list = list.filter((s) => !("publication_date" in s) || !s.publication_date);
    list.sort((a, b) => {
      const specDiff = specifitySortKey(a.specifity) - specifitySortKey(b.specifity);
      if (specDiff !== 0) return specDiff;
      return String(a.name ?? "").localeCompare(String(b.name ?? ""));
    });
    return list;
  }, [all, filter, activeServiceType]);

  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

  const breadcrumbs = [
    { label: "Production", href: "/logged/pages/production/services" },
    { label: "Services" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Services",
      breadcrumbs,
      buttons: [{ label: "Create Service", href: "/logged/pages/production/services/create" }],
    });
  }, [setPageMeta, breadcrumbs]);

  const resetPage = () => setPage(1);

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
              <ServiceTypeFilterTabs
                tabs={serviceTypeTabs}
                activeServiceType={activeServiceType}
                onSelect={(value) => {
                  setActiveServiceType(value);
                  setPage(1);
                }}
              />
              <ServicesListFilters filter={filter} setFilter={setFilter} onAnyChangeResetPage={resetPage} />
              <ServicesListInfoNote />
              <ServicesListTable
                rows={paginated}
                serviceTypeLabel={serviceTypeLabel}
                onRowClick={(id) => router.push(`/logged/pages/production/services/${id}`)}
              />

              <ServicesListPagination
                start={start}
                itemsPerPage={ITEMS_PER_PAGE}
                filteredLength={filtered.length}
                totalPages={totalPages}
                page={page}
                setPage={setPage}
                showPagination={filtered.length > ITEMS_PER_PAGE || totalPages > 1}
              />
            </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default ServicesListPage;
