"use client";

import React, { FC, Suspense, useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSyncPageMeta } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import CustomerSelectModal from "@/app/logged/logged_components/modals/CustomerSelectModal";
import ContactSelectModal from "@/app/logged/logged_components/modals/ContactSelectModal";
import ServiceSelectModal from "@/app/logged/logged_components/modals/ServiceSelectModal";
import type { ServiceRow, ServiceExtra } from "@/app/logged/logged_components/modals/ServiceSelectModal";
import type { ServiceLineDraft } from "@/app/logged/logged_components/modals/ServiceSelectModal/modal_service_select_components/types";
import { getContributingServiceTotal, computeCalculatedServiceTotal } from "./serviceLinePricing";
import MagazinePreferentialAvailabilityModal from "./components/MagazinePreferentialAvailabilityModal";
import { isMagazinePreferentialTariffGroup } from "./components/magazinePreferentialConstants";
import { ServiceService } from "@/app/service/ServiceService";
import { CustomerService } from "@/app/service/CustomerService";
import { ContactService } from "@/app/service/ContactService";
import { ProposalService } from "@/app/service/ProposalService";

import Step1AccountContact from "./components/Step1AccountContact";
import Step2Products from "./components/Step2Products";
import Step3Payment from "./components/Step3Payment";
import Step4Review from "./components/Step4Review";
import type { Contact, Customer, ProposalForm, Service, ServiceLine, Step } from "./components/types";
import { buildDraftPayload, buildDraftSnapshot, buildFinalizePayload } from "./buildDraftPayload";
import {
  parseProposalFaseToStep,
  proposalApiToForm,
  proposalApiToVariationForm,
  stepToProposalFase,
  type LoadedProposalApi,
} from "./proposalWizardUtils";
import { getContactCreateFromProposalHref } from "@/app/logged/pages/account-management/contacts_db/contactRoutes";

function normalizeServiceForProposalUi(raw: unknown): Service | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = String(r.id_service ?? r.service_id ?? "").trim();
  if (!id) return null;

  const name = String(r.name ?? r.service_full_name ?? "").trim() || id;
  const display =
    String(r.display_name ?? "").trim() ||
    String(r.shown_name ?? "").trim() ||
    name;

  const desc =
    String(r.description ?? r.service_description ?? "").trim();

  const specs = String(r.service_unit_specifications ?? "").trim();

  const tariff = Number(r.tariff_price_eur ?? r.service_unit_price ?? r.price ?? 0);
  const tariff_price_eur = Number.isFinite(tariff) ? tariff : 0;

  return {
    id_service: id,
    name,
    display_name: display,
    description: desc,
    service_description: desc,
    service_unit_specifications: specs,
    tariff_price_eur,
    unit: r.service_unit != null ? String(r.service_unit) : undefined,
  };
}

function generateDraftProposalId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `prop-${crypto.randomUUID()}`;
  }
  return `prop_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function proposalTitleSegmentFromAccountName(name: string): string {
  return name.trim().replace(/\s+/g, "_");
}

const PROPOSALS_LIST_URL = "/logged/pages/account-management/proposals";

type CreateProposalPageContentProps = {
  resumeProposalId?: string;
  variationFromProposalId?: string;
};

const CreateProposalPageContent: FC<CreateProposalPageContentProps> = ({
  resumeProposalId,
  variationFromProposalId,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerFromUrl = searchParams.get("customer")?.trim() ?? "";
  const newContactFromUrl = searchParams.get("new_contact")?.trim() ?? "";
  const resumeId = resumeProposalId?.trim() ?? "";
  const variationId = variationFromProposalId?.trim() ?? "";
  const [resumeLoading, setResumeLoading] = useState(Boolean(resumeId || variationId));
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  useEffect(() => {
    ServiceService.getAllServices()
      .then((list) => {
        const rows = Array.isArray(list) ? list : [];
        setServices(rows.map((x) => normalizeServiceForProposalUi(x)).filter(Boolean) as Service[]);
      })
      .catch(() => setServices([]));
  }, []);
  useEffect(() => {
    CustomerService.getAllCustomers().then((l: Customer[]) => setCustomers(Array.isArray(l) ? l : [])).catch(() => setCustomers([]));
    ContactService.getAllContacts().then((l: Contact[]) => setContacts(Array.isArray(l) ? l : [])).catch(() => setContacts([]));
  }, []);

  const [step, setStep] = useState<Step>(1);
  const stepRef = useRef<Step>(step);
  stepRef.current = step;
  const [form, setForm] = useState<ProposalForm>({
    id_customer: "",
    id_contact: "",
    additionalContactIds: [],
    draft_id_proposal: resumeId || generateDraftProposalId(),
    title: "",
    proposal_date: new Date().toISOString().slice(0, 10),
    expiration_date: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 2);
      return d.toISOString().slice(0, 10);
    })(),
    serviceLines: [],
    general_discount_mode: "pct",
    general_discount_pct: 0,
    general_discount_abs_eur: 0,
    payments: [],
    isExchange: false,
    exchangeHasFinalPrice: false,
    exchangeFinalPrice: 0,
    exchangeHasBankTransfers: false,
    exchangePlyniumTransferDate: "",
    exchangeCounterpartDate: "",
    exchangeTransferredAmount: 0,
    exchangeToBeReceivedHtml: "",
  });

  useEffect(() => {
    if (!resumeId) return;
    let cancelled = false;
    (async () => {
      setResumeLoading(true);
      setResumeError(null);
      try {
        const p = (await ProposalService.getProposalById(resumeId)) as LoadedProposalApi;
        if (cancelled) return;
        const status = String(p.status ?? "")
          .trim()
          .toLowerCase();
        const detailUrl = `/logged/pages/account-management/proposals/${encodeURIComponent(p.id_proposal)}`;
        if (status !== "draft") {
          router.replace(detailUrl);
          return;
        }
        const faseStep = parseProposalFaseToStep(p.proposal_fase);
        const resumeStep: Step = faseStep === "created" ? 4 : faseStep;
        const loadedForm = proposalApiToForm(p);
        setForm(loadedForm);
        stepRef.current = resumeStep;
        setStep(resumeStep);
        setDraftPersisted(true);
        setPersistedSnapshot(buildDraftSnapshot(loadedForm, resumeStep));
        proposalTitleUserEditedRef.current = true;
      } catch (e: unknown) {
        if (cancelled) return;
        const ax = e as { response?: { data?: { message?: string } }; message?: string };
        setResumeError(
          ax?.response?.data?.message ||
            (e instanceof Error ? e.message : null) ||
            ax?.message ||
            "Could not load draft proposal."
        );
      } finally {
        if (!cancelled) setResumeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resumeId, router]);

  useEffect(() => {
    if (!variationId || resumeId) return;
    let cancelled = false;
    (async () => {
      setResumeLoading(true);
      setResumeError(null);
      try {
        const p = (await ProposalService.getProposalById(variationId)) as LoadedProposalApi;
        if (cancelled) return;
        const newDraftId = generateDraftProposalId();
        const loadedForm = proposalApiToVariationForm(p, newDraftId);
        setForm(loadedForm);
        stepRef.current = 1;
        setStep(1);
        setDraftPersisted(false);
        setPersistedSnapshot(null);
        proposalTitleUserEditedRef.current = true;
      } catch (e: unknown) {
        if (cancelled) return;
        const ax = e as { response?: { data?: { message?: string } }; message?: string };
        setResumeError(
          ax?.response?.data?.message ||
            (e instanceof Error ? e.message : null) ||
            ax?.message ||
            "Could not load proposal to copy."
        );
      } finally {
        if (!cancelled) setResumeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [variationId, resumeId]);

  useEffect(() => {
    if (!customerFromUrl || customers.length === 0 || resumeId || variationId) return;
    if (!customers.some((c) => c.id_customer === customerFromUrl)) return;
    setForm((f) => {
      if (f.id_customer === customerFromUrl) return f;
      return { ...f, id_customer: customerFromUrl, id_contact: "" };
    });
  }, [customerFromUrl, customers]);

  useEffect(() => {
    if (!form.id_customer) return;
    const forCust = contacts.filter((c) => c.id_customer === form.id_customer);
    if (forCust.length !== 1 || form.id_contact) return;
    setForm((f) => ({ ...f, id_contact: forCust[0].id_contact }));
  }, [form.id_customer, form.id_contact, contacts]);

  useEffect(() => {
    if (!newContactFromUrl) return;
    ContactService.getAllContacts()
      .then((list: Contact[]) => {
        const rows = Array.isArray(list) ? list : [];
        setContacts(rows);
        const match = rows.find((c) => c.id_contact === newContactFromUrl);
        if (!match) return;
        setForm((f) => ({
          ...f,
          id_contact: newContactFromUrl,
          id_customer: f.id_customer || match.id_customer || "",
        }));
        const proposalIdForPatch = resumeId || form.draft_id_proposal;
        if (proposalIdForPatch) {
          void ProposalService.updateProposal(proposalIdForPatch, {
            id_contact: newContactFromUrl,
            proposal_fase: stepToProposalFase(stepRef.current),
          }).catch(() => {});
        }
      })
      .catch(() => {});
  }, [newContactFromUrl, resumeId, form.draft_id_proposal]);

  const proposalTitleUserEditedRef = useRef(false);
  const prevIdCustomerForTitleRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const prev = prevIdCustomerForTitleRef.current;
    if (prev && form.id_customer && prev !== form.id_customer) {
      proposalTitleUserEditedRef.current = false;
    }
    prevIdCustomerForTitleRef.current = form.id_customer;
  }, [form.id_customer]);

  useEffect(() => {
    if (proposalTitleUserEditedRef.current) return;
    if (!form.id_customer) return;
    const cust = customers.find((c) => c.id_customer === form.id_customer);
    if (!cust) return;
    const nameSeg = proposalTitleSegmentFromAccountName(cust.name || "");
    const parts = [nameSeg || undefined, form.proposal_date, form.draft_id_proposal].filter(Boolean) as string[];
    const nextTitle = parts.join("_");
    setForm((f) => (f.title === nextTitle ? f : { ...f, title: nextTitle }));
  }, [form.id_customer, form.proposal_date, form.draft_id_proposal, customers]);

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [additionalContactModalOpen, setAdditionalContactModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [insertAtIndex, setInsertAtIndex] = useState<number>(0);
  const [preferentialModal, setPreferentialModal] = useState<{ service: ServiceRow; extra: ServiceExtra } | null>(null);
  const [plyniumAgentName, setPlyniumAgentName] = useState<string>("");
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [draftPersisted, setDraftPersisted] = useState(false);
  const [persistedSnapshot, setPersistedSnapshot] = useState<string | null>(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSaveError, setDraftSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPlyniumAgentName(localStorage.getItem("username") ?? "");
    }
  }, []);

  const contactsForCustomer = useMemo(
    () => contacts.filter((c) => c.id_customer === form.id_customer),
    [form.id_customer]
  );

  const canAdvanceStep1 = form.id_customer && form.id_contact && form.title.trim().length > 0;
  const canAdvanceStep2 = form.serviceLines.length > 0;

  const persistWizardFase = useCallback(
    async (nextStep: Step) => {
      if (!draftPersisted || !form.draft_id_proposal.trim()) return;
      try {
        await ProposalService.updateProposal(form.draft_id_proposal, {
          proposal_fase: stepToProposalFase(nextStep),
        });
      } catch {
        // Best-effort sync of wizard step in DB
      }
    },
    [draftPersisted, form.draft_id_proposal]
  );

  const goToStep = useCallback(
    (next: Step) => {
      stepRef.current = next;
      setStep(next);
      void persistWizardFase(next);
    },
    [persistWizardFase]
  );

  const goNext = () => {
    if (step === 1 && canAdvanceStep1) goToStep(2);
    else if (step === 2 && canAdvanceStep2) goToStep(3);
    else if (step === 3 && canAdvanceStep3) goToStep(4);
  };

  const goBack = () => {
    if (step > 1) goToStep((step - 1) as Step);
  };

  const selectedCustomer = customers.find((c) => c.id_customer === form.id_customer);
  const selectedContact = contacts.find((c) => c.id_contact === form.id_contact);
  const getServiceName = (id: string) => services.find((s) => s.id_service === id)?.display_name ?? services.find((s) => s.id_service === id)?.name ?? id;

  const totalBeforeDiscount = form.serviceLines.reduce((sum, l) => sum + getContributingServiceTotal(l), 0);
  const totalPreTax =
    form.general_discount_mode === "abs"
      ? Math.max(0, totalBeforeDiscount - (Number(form.general_discount_abs_eur) || 0))
      : totalBeforeDiscount * (1 - (Number(form.general_discount_pct) || 0) / 100);
  const isSpain = (selectedCustomer?.country ?? "").toLowerCase() === "spain";
  const vatPct = isSpain ? 21 : 0;
  const totalAfterTax = totalPreTax * (1 + vatPct / 100);
  const paymentsSum = form.payments.reduce((s, p) => s + p.amount, 0);
  const paymentsMatchTotal = form.payments.length > 0 && Math.abs(paymentsSum - totalAfterTax) < 0.01;
  const canAdvanceStep3 = form.isExchange || paymentsMatchTotal;

  const currentDraftSnapshot = useMemo(() => buildDraftSnapshot(form, step), [form, step]);
  const isDraftSaved =
    persistedSnapshot !== null && currentDraftSnapshot === persistedSnapshot;

  useEffect(() => {
    if (step === 4) setCreateError(null);
  }, [step]);

  const saveDraft = useCallback(async (): Promise<boolean> => {
    const currentStep = stepRef.current;
    const proposalFase = stepToProposalFase(currentStep);
    if (!form.id_customer.trim()) {
      setDraftSaveError("Select an account before saving a draft.");
      return false;
    }
    setDraftSaveError(null);
    setDraftSaving(true);
    try {
      const payload = buildDraftPayload(form, totalAfterTax, plyniumAgentName, currentStep);
      await ProposalService.saveDraftProposal(
        form.draft_id_proposal,
        { ...payload, proposal_fase: proposalFase },
        { alreadyPersisted: draftPersisted }
      );
      setDraftPersisted(true);
      setPersistedSnapshot(buildDraftSnapshot(form, currentStep));
      if (!resumeId) {
        router.replace(
          `/logged/pages/account-management/proposals/create/${encodeURIComponent(form.draft_id_proposal)}`,
          { scroll: false }
        );
      }
      return true;
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        ax?.response?.data?.message ||
        (e instanceof Error ? e.message : null) ||
        ax?.message ||
        "Could not save draft.";
      setDraftSaveError(String(msg));
      return false;
    } finally {
      setDraftSaving(false);
    }
  }, [form, totalAfterTax, plyniumAgentName, draftPersisted, resumeId, router]);

  const handleBackAndSave = useCallback(async () => {
    const ok = await saveDraft();
    if (ok) {
      router.push(PROPOSALS_LIST_URL);
      router.refresh();
    }
  }, [saveDraft, router]);

  /** Header buttons use useSyncPageMeta; onClick identity is not re-synced on every render. */
  const saveDraftRef = useRef(saveDraft);
  saveDraftRef.current = saveDraft;
  const handleBackAndSaveRef = useRef(handleBackAndSave);
  handleBackAndSaveRef.current = handleBackAndSave;
  const onSaveDraftClick = useMemo(
    () => () => {
      void saveDraftRef.current();
    },
    []
  );
  const onBackAndSaveClick = useMemo(
    () => () => {
      void handleBackAndSaveRef.current();
    },
    []
  );

  const handleCreateContactFromProposal = useCallback(async () => {
    const ok = await saveDraftRef.current();
    if (!ok) return;
    router.push(getContactCreateFromProposalHref(form.draft_id_proposal));
  }, [form.draft_id_proposal, router]);

  const handleCreateProposal = useCallback(async () => {
    setCreateError(null);
    setCreateSaving(true);
    try {
      const finalizePayload = buildFinalizePayload(form, totalAfterTax, plyniumAgentName);
      const created = draftPersisted
        ? await ProposalService.updateProposal(form.draft_id_proposal, finalizePayload)
        : await ProposalService.createProposal(finalizePayload);
      setDraftPersisted(true);
      setPersistedSnapshot(buildDraftSnapshot(form, step));
      router.push(`/logged/pages/account-management/proposals/${encodeURIComponent(created.id_proposal)}`);
      router.refresh();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        ax?.response?.data?.message ||
        (e instanceof Error ? e.message : null) ||
        ax?.message ||
        "Could not create proposal.";
      setCreateError(String(msg));
    } finally {
      setCreateSaving(false);
    }
  }, [form, step, draftPersisted, plyniumAgentName, totalAfterTax, router]);

  const appendServiceLineFromPicker = useCallback(
    (
      service: ServiceRow,
      extra?: ServiceExtra,
      pref?: { preferential_slot_id: string; position_in_magazine: string },
      lineDraft?: ServiceLineDraft
    ) => {
      const normalized = normalizeServiceForProposalUi(service as unknown) ?? {
        id_service: service.id_service,
        name: service.name,
        display_name: service.display_name,
        description: String((service as unknown as Record<string, unknown>)?.description ?? ""),
        service_unit_specifications: String(
          (service as unknown as Record<string, unknown>)?.service_unit_specifications ?? ""
        ),
        tariff_price_eur: service.tariff_price_eur,
      };

      const baseDescription = String(normalized.service_description ?? normalized.description ?? "").trim();
      const baseSpecifications = String(normalized.service_unit_specifications ?? "").trim();

      let description = baseDescription;
      if (!lineDraft && extra && "publicationLabel" in extra) {
        const label = String(extra.publicationLabel ?? "").trim();
        if (label) {
          description = baseDescription ? `${baseDescription}\n${label}` : label;
        }
      }
      if (!lineDraft && pref?.position_in_magazine) {
        const pl = `Preferential placement: ${pref.position_in_magazine}`;
        description = description ? `${description}\n${pl}` : pl;
      }

      const unitPrice = lineDraft ? lineDraft.unit_price : service.tariff_price_eur;
      const discountPct = lineDraft ? lineDraft.discount_pct : 0;
      const units = lineDraft ? lineDraft.units : 1;
      const serviceTotal = lineDraft
        ? computeCalculatedServiceTotal(units, unitPrice, discountPct)
        : computeCalculatedServiceTotal(1, unitPrice, 0);

      const newLine: ServiceLine = {
        lineId: `line-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        id_service: service.id_service,
        description: lineDraft ? lineDraft.description : description,
        specifications: lineDraft ? lineDraft.specifications : baseSpecifications,
        units,
        discount_pct: discountPct,
        unit_price: unitPrice,
        price: unitPrice,
        price_mode: "calculated",
        service_total_price: serviceTotal,
        ...(extra && "publicationMonth" in extra && { publicationMonth: extra.publicationMonth, publicationYear: extra.publicationYear }),
        ...(extra && "startDate" in extra && { startDate: extra.startDate, endDate: extra.endDate }),
        ...(extra &&
          "publicationDateIso" in extra &&
          typeof (extra as { publicationDateIso?: string }).publicationDateIso === "string" &&
          String((extra as { publicationDateIso?: string }).publicationDateIso).trim() && {
            startDate: String((extra as { publicationDateIso?: string }).publicationDateIso).trim().slice(0, 10),
          }),
        ...(extra && "id_planned_publication" in extra && {
          id_planned_publication: extra.id_planned_publication,
          ...("pageType" in extra && { magazinePageType: extra.pageType, magazineSlotKey: extra.slotKey }),
          ...("preferential_slot_id" in extra &&
            extra.preferential_slot_id && {
              preferential_slot_id: extra.preferential_slot_id,
              position_in_magazine: (extra as { position_in_magazine?: string }).position_in_magazine,
            }),
        }),
        ...(pref
          ? { preferential_slot_id: pref.preferential_slot_id, position_in_magazine: pref.position_in_magazine }
          : {}),
      };
      if (extra && "calculatedPrice" in extra) {
        newLine.unit_price = extra.calculatedPrice;
        newLine.price = extra.calculatedPrice;
        newLine.service_total_price = computeCalculatedServiceTotal(
          newLine.units,
          extra.calculatedPrice,
          newLine.discount_pct
        );
      }
      setForm((f) => ({
        ...f,
        serviceLines: [...f.serviceLines.slice(0, insertAtIndex), newLine, ...f.serviceLines.slice(insertAtIndex)],
      }));
    },
    [insertAtIndex]
  );

  const pageHeading = resumeId
    ? "Continue proposal"
    : variationId
      ? "New proposal (variation)"
      : "New proposal";

  const breadcrumbs = [
    { label: "Account management", href: "/logged/pages/account-management/customers_db" },
    { label: "Proposals", href: PROPOSALS_LIST_URL },
    { label: pageHeading },
  ];

  useSyncPageMeta({
    pageTitle: pageHeading,
    breadcrumbs,
    buttons: [
      {
        label: "Save",
        icon: "save",
        iconOnly: true,
        saved: isDraftSaved,
        disabled: draftSaving,
        title: isDraftSaved ? "All changes saved" : "Save draft",
        onClick: onSaveDraftClick,
      },
      {
        label: "Back and Save",
        disabled: draftSaving,
        onClick: onBackAndSaveClick,
      },
    ],
  });

  if (resumeLoading) {
    return (
      <PageContentSection>
        <p className="p-6 text-gray-600">Loading draft proposal…</p>
      </PageContentSection>
    );
  }

  if (resumeError) {
    return (
      <PageContentSection>
        <div className="p-6">
          <p className="mb-4 text-sm text-red-700" role="alert">
            {resumeError}
          </p>
          <button
            type="button"
            onClick={() => router.push(PROPOSALS_LIST_URL)}
            className="rounded-lg bg-blue-950/90 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900"
          >
            Back to proposals
          </button>
        </div>
      </PageContentSection>
    );
  }

  return (
    <>
      <PageContentSection className="p-0">
      <div className="flex flex-col w-full">
      <div className="flex border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex items-center gap-4">
          {([1, 2, 3, 4] as Step[]).map((s) => (
            <React.Fragment key={s}>
              <button
                type="button"
                onClick={() => s < step && goToStep(s)}
                className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                  step === s ? "bg-blue-600 text-white" : step > s ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-500"
                } ${step > s ? "cursor-pointer" : ""}`}
              >
                {s}
              </button>
              {s < 4 && <span className="w-8 h-0.5 bg-gray-300" />}
            </React.Fragment>
          ))}
          <span className="text-sm text-gray-600 ml-2">
            {step === 1 && "Account and contact"}
            {step === 2 && "Products"}
            {step === 3 && "Payment"}
            {step === 4 && "Review"}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-b-lg overflow-hidden p-6 md:p-8 w-full">
        {draftSaveError && (
          <div
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {draftSaveError}
          </div>
        )}
        {step === 1 && (
          <Step1AccountContact
            form={form}
            setForm={setForm}
            customers={customers}
            contacts={contacts}
            onOpenCustomerModal={() => setCustomerModalOpen(true)}
            onOpenMainContactModal={() => form.id_customer && setContactModalOpen(true)}
            onOpenAdditionalContactModal={() => form.id_customer && setAdditionalContactModalOpen(true)}
            onProposalTitleUserEdit={() => {
              proposalTitleUserEditedRef.current = true;
            }}
            canAdvance={!!canAdvanceStep1}
            onNext={goNext}
            onCreateContactFromProposal={handleCreateContactFromProposal}
            createContactSaving={draftSaving}
          />
        )}

        {step === 2 && (
          <Step2Products
            form={form}
            setForm={setForm}
            services={services}
            selectedCustomer={selectedCustomer}
            getServiceName={getServiceName}
            totalBeforeDiscount={totalBeforeDiscount}
            totalPreTax={totalPreTax}
            totalAfterTax={totalAfterTax}
            vatPct={vatPct}
            onBack={goBack}
            onNext={goNext}
            canAdvance={!!canAdvanceStep2}
            onOpenServiceModalAt={(index) => {
              setInsertAtIndex(index);
              setServiceModalOpen(true);
            }}
          />
        )}

        {step === 3 && (
          <Step3Payment
            form={form}
            setForm={setForm}
            totalAfterTax={totalAfterTax}
            paymentsSum={paymentsSum}
            paymentsMatchTotal={paymentsMatchTotal}
            onBack={goBack}
            onNext={goNext}
            canAdvance={!!canAdvanceStep3}
          />
        )}

        {step === 4 && (
          <Step4Review
            form={form}
            customers={customers}
            contacts={contacts}
            plyniumAgentName={plyniumAgentName}
            getServiceName={getServiceName}
            totalBeforeDiscount={totalBeforeDiscount}
            totalPreTax={totalPreTax}
            totalAfterTax={totalAfterTax}
            vatPct={vatPct}
            paymentsSum={paymentsSum}
            paymentsMatchTotal={paymentsMatchTotal}
            onBack={goBack}
            onCreate={handleCreateProposal}
            createSaving={createSaving}
            createError={createError}
          />
        )}
      </div>
      </div>
      </PageContentSection>

      <CustomerSelectModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSelectCustomer={(c) => {
          setForm((f) => ({ ...f, id_customer: c.id_customer, id_contact: "" }));
          setCustomerModalOpen(false);
        }}
      />
      <ContactSelectModal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        onSelectContact={(c) => {
          setForm((f) => ({
            ...f,
            id_contact: c.id_contact,
            additionalContactIds: f.additionalContactIds.filter((id) => id !== c.id_contact),
          }));
          setContactModalOpen(false);
        }}
        filterByCustomerId={form.id_customer || undefined}
      />
      <ContactSelectModal
        open={additionalContactModalOpen}
        onClose={() => setAdditionalContactModalOpen(false)}
        onSelectContact={(c) => {
          setForm((f) => ({
            ...f,
            additionalContactIds: f.additionalContactIds.includes(c.id_contact)
              ? f.additionalContactIds
              : [...f.additionalContactIds, c.id_contact],
          }));
          setAdditionalContactModalOpen(false);
        }}
        filterByCustomerId={form.id_customer || undefined}
        excludeContactIds={[form.id_contact, ...form.additionalContactIds].filter(Boolean)}
      />
      <ServiceSelectModal
        open={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        onConfirm={(service: ServiceRow, extra?: ServiceExtra, lineDraft?: ServiceLineDraft) => {
          const gid = String(service.service_group_id ?? service.related_to_other_services ?? "").trim();
          const pubId =
            extra && typeof extra === "object" && "id_planned_publication" in extra
              ? String((extra as { id_planned_publication?: string }).id_planned_publication ?? "").trim()
              : "";
          const prefSlotId =
            extra && typeof extra === "object" && "preferential_slot_id" in extra
              ? String((extra as { preferential_slot_id?: string }).preferential_slot_id ?? "").trim()
              : "";
          const prefPosition =
            extra && typeof extra === "object" && "position_in_magazine" in extra
              ? String((extra as { position_in_magazine?: string }).position_in_magazine ?? "").trim()
              : "";
          if (
            isMagazinePreferentialTariffGroup(gid, service.name) &&
            pubId &&
            extra &&
            !prefSlotId
          ) {
            setPreferentialModal({ service, extra });
            return;
          }
          appendServiceLineFromPicker(
            service,
            extra,
            prefSlotId && prefPosition
              ? { preferential_slot_id: prefSlotId, position_in_magazine: prefPosition }
              : undefined,
            lineDraft
          );
        }}
      />
      {preferentialModal && (
        <MagazinePreferentialAvailabilityModal
          open
          service={preferentialModal.service}
          publicationId={
            preferentialModal.extra && "id_planned_publication" in preferentialModal.extra
              ? String(preferentialModal.extra.id_planned_publication ?? "").trim()
              : ""
          }
          onClose={() => setPreferentialModal(null)}
          onConfirmPlacement={(patch) => {
            appendServiceLineFromPicker(preferentialModal.service, preferentialModal.extra, patch);
            setPreferentialModal(null);
          }}
        />
      )}
    </>
  );
};

export { CreateProposalPageContent };
