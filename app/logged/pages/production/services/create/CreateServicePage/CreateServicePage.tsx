"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ServiceService } from "@/app/service/ServiceService";
import { ServiceGroupService } from "@/app/service/ServiceGroupService";
import { PortalService } from "@/app/service/PortalService";
import { MagazineService } from "@/app/service/MagazineService";
import { PublicationService } from "@/app/service/PublicationService";

import type {
  Channel,
  FormState,
  PublicationRow,
  ServiceGroupRow,
  Step,
} from "./create_service_components/create_service_types";
import { initialForm } from "./create_service_components/create_service_types";
import { publicationYearsDescending, suggestNextCatalogServiceId } from "./create_service_components/create_service_helpers";
import { CreateServiceWizardHeader } from "./create_service_components/CreateServiceWizardHeader";
import { CreateServiceStepChannelGroup } from "./create_service_components/CreateServiceStepChannelGroup";
import { CreateServiceStepCustomFields } from "./create_service_components/CreateServiceStepCustomFields";
import { CreateServiceStepDescription } from "./create_service_components/CreateServiceStepDescription";
import { CreateServiceStepNameReview } from "./create_service_components/CreateServiceStepNameReview";

const CreateServicePage: FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const [allServices, setAllServices] = useState<{ id_service: string }[]>([]);
  const [serviceGroups, setServiceGroups] = useState<ServiceGroupRow[]>([]);
  const [portals, setPortals] = useState<{ id: number; name: string }[]>([]);
  const [magazines, setMagazines] = useState<{ id_magazine: string; name: string }[]>([]);
  const [magazinePublications, setMagazinePublications] = useState<PublicationRow[]>([]);
  const [campaignsForPortal, setCampaignsForPortal] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    ServiceService.getAllServices()
      .then((list) => setAllServices(Array.isArray(list) ? list : []))
      .catch(() => setAllServices([]));
  }, []);

  useEffect(() => {
    ServiceGroupService.getAllServiceGroups()
      .then((list) => setServiceGroups(Array.isArray(list) ? list : []))
      .catch(() => setServiceGroups([]));
  }, []);

  useEffect(() => {
    PortalService.getAllPortals()
      .then((list) => setPortals(Array.isArray(list) ? list : []))
      .catch(() => setPortals([]));
  }, []);

  useEffect(() => {
    MagazineService.getAllMagazines()
      .then((list) => setMagazines(Array.isArray(list) ? list : []))
      .catch(() => setMagazines([]));
  }, []);

  const backUrl = "/logged/pages/production/services";
  const breadcrumbs = [
    { label: "Production", href: "/logged/pages/production/services" },
    { label: "Services", href: backUrl },
    { label: "Create service" },
  ];
  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Create service",
      breadcrumbs,
      buttons: [{ label: "Back", href: backUrl }],
    });
  }, [setPageMeta]);

  const nextId = useMemo(() => suggestNextCatalogServiceId(allServices, new Date().getFullYear()), [allServices]);
  const displayId = form.id_service || nextId;

  const channels = useMemo(() => {
    const set = new Set<string>();
    for (const g of serviceGroups) set.add(String(g.service_group_channel ?? "").toLowerCase());
    const ordered: Channel[] = ["dem", "portal", "magazine"];
    return ordered.filter((c) => set.has(c));
  }, [serviceGroups]);

  const groupsForChannel = useMemo(() => {
    if (!form.service_group_channel) return [];
    return serviceGroups
      .filter((g) => String(g.service_group_channel).toLowerCase() === form.service_group_channel)
      .sort((a, b) => String(a.service_group_name).localeCompare(String(b.service_group_name)));
  }, [serviceGroups, form.service_group_channel]);

  const selectedGroup = useMemo(
    () => serviceGroups.find((g) => g.service_group_id === form.service_group_id) ?? null,
    [serviceGroups, form.service_group_id]
  );

  useEffect(() => {
    if (!form.custom || form.custom.channel !== "magazine") return;
    const mid = form.custom.magazineId;
    if (!mid) {
      setMagazinePublications([]);
      return;
    }
    PublicationService.listPublicationsForMagazine(mid)
      .then((list: unknown[]) => {
        const rows = Array.isArray(list) ? list : [];
        setMagazinePublications(
          rows
            .filter((x): x is Record<string, unknown> => x !== null && typeof x === "object")
            .map((x) => ({
              id_publication: String(x.id_publication ?? x.publication_id ?? x.id ?? "").trim(),
              edition_name: x.edition_name != null ? String(x.edition_name) : undefined,
              publication_edition_name:
                x.publication_edition_name != null ? String(x.publication_edition_name) : undefined,
              publication_year:
                x.publication_year != null && String(x.publication_year).trim() !== ""
                  ? Number(x.publication_year)
                  : null,
            }))
            .filter((p) => p.id_publication.length > 0)
        );
      })
      .catch(() => setMagazinePublications([]));
  }, [form.custom]);

  useEffect(() => {
    if (!form.custom || form.custom.channel !== "dem") return;
    const pid = form.custom.portalId;
    if (!pid) {
      setCampaignsForPortal([]);
      return;
    }
    PortalService.getNewsletterCampaignsForPortal(pid)
      .then((list: unknown[]) => {
        const rows = Array.isArray(list) ? list : [];
        setCampaignsForPortal(
          rows
            .filter((x): x is Record<string, unknown> => x !== null && typeof x === "object")
            .map((x) => ({
              id: String(x.id ?? "").trim(),
              name: String(x.name ?? "").trim(),
            }))
            .filter((c) => c.id && c.name)
        );
      })
      .catch(() => setCampaignsForPortal([]));
  }, [form.custom]);

  const magazinePublicationYears = useMemo(() => {
    if (!form.custom || form.custom.channel !== "magazine" || !form.custom.magazineId) return [];
    return publicationYearsDescending(magazinePublications);
  }, [form.custom, magazinePublications]);

  const publicationsForMagazineYear = useMemo(() => {
    if (!form.custom || form.custom.channel !== "magazine") return [];
    const yStr = form.custom.publicationYear?.trim();
    if (!yStr) return [];
    const y = Number(yStr);
    if (!Number.isFinite(y)) return [];
    return magazinePublications.filter((p) => {
      const py = p.publication_year == null ? NaN : Number(p.publication_year);
      return Number.isFinite(py) && Math.trunc(py) === Math.trunc(y);
    });
  }, [form.custom, magazinePublications]);

  const canAdvanceStep1 = !!form.service_group_channel && !!form.service_group_id;

  const canAdvanceStep2 = useMemo(() => {
    if (!form.custom) return false;
    if (form.custom.channel === "portal") return !!form.custom.portalId;
    if (form.custom.channel === "magazine")
      return !!form.custom.magazineId && !!form.custom.publicationYear.trim() && !!form.custom.publicationId;
    const m = Number(form.custom.publicationMonth);
    const y = Number(form.custom.publicationYear);
    return (
      Number.isFinite(m) &&
      m >= 1 &&
      m <= 12 &&
      Number.isFinite(y) &&
      y >= 2000 &&
      y <= 2100 &&
      !!form.custom.portalId &&
      !!form.custom.campaignId
    );
  }, [form.custom]);

  const canAdvanceStep3 = form.service_description.trim().length > 0;

  const suggestedName = useMemo(() => {
    if (!selectedGroup || !form.custom) return "";
    const groupName = selectedGroup.service_group_name ?? "";
    if (form.custom.channel === "portal") return `${form.custom.portalName}-${groupName}`.trim();
    if (form.custom.channel === "magazine") return `${form.custom.publicationEditionName}-${groupName}`.trim();
    return `${form.custom.campaignName}-${groupName}`.trim();
  }, [selectedGroup, form.custom]);

  const canCreate = form.final_service_name.trim().length > 0 && canAdvanceStep3 && !!selectedGroup && !!form.custom;

  const goNext = () => {
    if (step === 1 && canAdvanceStep1) {
      setForm((f) => ({
        ...f,
        id_service: "",
        custom:
          f.service_group_channel === "dem"
            ? {
                channel: "dem",
                publicationMonth: "",
                publicationYear: String(new Date().getFullYear()),
                portalId: "",
                campaignId: "",
                campaignName: "",
              }
            : f.service_group_channel === "portal"
              ? { channel: "portal", portalId: "", portalName: "" }
              : {
                  channel: "magazine",
                  magazineId: "",
                  magazineName: "",
                  publicationYear: "",
                  publicationId: "",
                  publicationEditionName: "",
                },
      }));
      setStep(2);
      return;
    }
    if (step === 2 && canAdvanceStep2) {
      const baseDesc = String((selectedGroup as Record<string, unknown>)?.service_base_description ?? "").trim();
      const baseSpecs = String((selectedGroup as Record<string, unknown>)?.service_specifications ?? "").trim();
      let desc = baseDesc;
      if (form.custom?.channel === "dem") {
        const extra = `\n\nPublication month: ${form.custom.publicationMonth}/${form.custom.publicationYear}\nNewsletter campaign: ${form.custom.campaignName}`;
        desc = desc ? desc + extra : extra.trimStart();
      }
      if (form.custom?.channel === "magazine") {
        const extra = `\n\nMagazine: ${form.custom.magazineName}\nEdition: ${form.custom.publicationEditionName} (${form.custom.publicationYear})`;
        desc = desc ? desc + extra : extra.trimStart();
      }
      setForm((f) => ({
        ...f,
        service_description: desc,
        service_unit_specifications: baseSpecs,
      }));
      setStep(3);
      return;
    }
    if (step === 3 && canAdvanceStep3) {
      setForm((f) => ({ ...f, final_service_name: f.final_service_name || suggestedName }));
      setStep(4);
    }
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const handleCreate = async () => {
    if (!selectedGroup || !form.custom) return;
    setSubmitting(true);
    setCreateError(null);
    try {
      const portalId =
        form.custom.channel === "portal"
          ? Number(form.custom.portalId || 0)
          : form.custom.channel === "dem"
            ? Number(form.custom.portalId || 0)
            : 0;

      const created = await ServiceService.createService({
        mint_catalog_service_id: true,
        name: form.final_service_name.trim(),
        service_group_id: selectedGroup.service_group_id,
        service_portal: Number.isFinite(portalId) ? portalId : 0,
        service_description: form.service_description,
        service_unit_specifications: form.service_unit_specifications,
        tariff_price_eur: Number(selectedGroup.tariff_price_eur ?? 0),
      });
      const newId =
        typeof created?.id_service === "string"
          ? created.id_service
          : typeof created?.service_id === "string"
            ? created.service_id
            : "";
      if (!newId) {
        throw new Error("Create succeeded but no service id returned");
      }
      router.push(`/logged/pages/production/services/${encodeURIComponent(newId)}`);
    } catch (err: unknown) {
      const msg =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: string }).message)
          : err instanceof Error
            ? err.message
            : "Could not create service";
      setCreateError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContentSection>
      <div className="flex flex-col w-full">
        <CreateServiceWizardHeader step={step} onJumpToCompletedStep={(s) => setStep(s)} />

        <div className="bg-white rounded-b-lg overflow-hidden">
          <div className="p-6 w-full">
            {step === 1 && (
              <CreateServiceStepChannelGroup
                form={form}
                displayId={displayId}
                channels={channels}
                groupsForChannel={groupsForChannel}
                canAdvanceStep1={canAdvanceStep1}
                setForm={setForm}
                onNext={goNext}
              />
            )}

            {step === 2 && form.custom && (
              <CreateServiceStepCustomFields
                form={form}
                selectedGroup={selectedGroup}
                portals={portals}
                magazines={magazines}
                campaignsForPortal={campaignsForPortal}
                magazinePublications={magazinePublications}
                magazinePublicationYears={magazinePublicationYears}
                publicationsForMagazineYear={publicationsForMagazineYear}
                canAdvanceStep2={canAdvanceStep2}
                setForm={setForm}
                setCampaignsForPortal={setCampaignsForPortal}
                setMagazinePublications={setMagazinePublications}
                onBack={goBack}
                onNext={goNext}
              />
            )}

            {step === 3 && (
              <CreateServiceStepDescription
                form={form}
                canAdvanceStep3={canAdvanceStep3}
                setForm={setForm}
                onBack={goBack}
                onNext={goNext}
              />
            )}

            {step === 4 && (
              <CreateServiceStepNameReview
                form={form}
                selectedGroup={selectedGroup}
                displayId={displayId}
                suggestedName={suggestedName}
                createError={createError}
                submitting={submitting}
                canCreate={canCreate}
                setForm={setForm}
                onBack={goBack}
                onCreate={handleCreate}
              />
            )}
          </div>
        </div>
      </div>
    </PageContentSection>
  );
};

export default CreateServicePage;
