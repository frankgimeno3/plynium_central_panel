"use client";

import React, { FC, useEffect, useState } from "react";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ServiceService } from "@/app/service/ServiceService";
import { ServiceGroupService } from "@/app/service/ServiceGroupService";

import { SERVICE_TYPES } from "./service_detail_components/service_detail_constants";
import type { EditFormState, ServiceDetailModel, ServiceType } from "./service_detail_components/service_detail_types";
import { ServiceDetailLoadingState } from "./service_detail_components/ServiceDetailLoadingState";
import { ServiceDetailMainPanel } from "./service_detail_components/ServiceDetailMainPanel";
import { ServiceDetailNotFoundState } from "./service_detail_components/ServiceDetailNotFoundState";

export type ServiceDetailPageProps = {
  serviceId: string;
};

const initialEditForm: EditFormState = {
  name: "",
  service_type: "",
  service_description: "",
  service_price: 0,
};

export const ServiceDetailPage: FC<ServiceDetailPageProps> = ({ serviceId: id_service }) => {
  const [service, setService] = useState<ServiceDetailModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<EditFormState>(initialEditForm);
  const [baseDescription, setBaseDescription] = useState("");

  const normalizeServiceType = (value?: string): ServiceType | "" => {
    if (!value) return "";
    return SERVICE_TYPES.some((t) => t.value === value) ? (value as ServiceType) : "";
  };

  useEffect(() => {
    ServiceService.getServiceById(id_service)
      .then((s) => setService((s as ServiceDetailModel | null | undefined) ?? null))
      .catch(() => setService(null))
      .finally(() => setLoading(false));
  }, [id_service]);

  useEffect(() => {
    if (!service) return;
    setForm({
      name: service.name ?? "",
      service_type: normalizeServiceType(service.service_type),
      service_description: service.service_description ?? "",
      service_price: service.tariff_price_eur ?? service.service_price ?? 0,
    });
    setBaseDescription(String(service.service_group_base_description ?? ""));
  }, [service]);
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

  if (loading) {
    return <ServiceDetailLoadingState />;
  }
  if (!service) {
    return <ServiceDetailNotFoundState />;
  }

  const canSave = form.name.trim().length > 0 && form.service_type !== "" && form.service_price >= 0;

  const handleReset = () => {
    setError(null);
    setForm({
      name: service.name ?? "",
      service_type: normalizeServiceType(service.service_type),
      service_description: service.service_description ?? "",
      service_price: service.tariff_price_eur ?? service.service_price ?? 0,
    });
    setBaseDescription(String(service.service_group_base_description ?? ""));
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await ServiceService.updateService(id_service, {
        name: form.name.trim(),
        service_type: form.service_type,
        service_description: form.service_description.trim(),
        tariff_price_eur: form.service_price,
      });
      if (service?.service_group_id) {
        await ServiceGroupService.updateServiceGroup(String(service.service_group_id), {
          service_base_description: baseDescription,
        });
      }
      const refreshed = await ServiceService.getServiceById(id_service);
      setService(refreshed ?? updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update service");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageContentSection>
        <ServiceDetailMainPanel
          service={service}
          form={form}
          baseDescription={baseDescription}
          saving={saving}
          error={error}
          canSave={canSave}
          setForm={setForm}
          setBaseDescription={setBaseDescription}
          onReset={handleReset}
          onSave={handleSave}
        />
      </PageContentSection>
    </>
  );
};
