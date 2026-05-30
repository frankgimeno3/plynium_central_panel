"use client";

import React, { FC, Suspense, useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import CustomerSelectModal from "@/app/logged/logged_components/modals/CustomerSelectModal";
import ContactSelectModal from "@/app/logged/logged_components/modals/ContactSelectModal";
import ServiceSelectModal from "@/app/logged/logged_components/modals/ServiceSelectModal";
import type { ServiceRow, ServiceExtra } from "@/app/logged/logged_components/modals/ServiceSelectModal";
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

const CreateProposalPageContent: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerFromUrl = searchParams.get("customer")?.trim() ?? "";
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
  const [form, setForm] = useState<ProposalForm>({
    id_customer: "",
    id_contact: "",
    additionalContactIds: [],
    draft_id_proposal: generateDraftProposalId(),
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
    if (!customerFromUrl || customers.length === 0) return;
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

  const goNext = () => {
    if (step === 1 && canAdvanceStep1) setStep(2);
    else if (step === 2 && canAdvanceStep2) setStep(3);
    else if (step === 3 && canAdvanceStep3) setStep(4);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const selectedCustomer = customers.find((c) => c.id_customer === form.id_customer);
  const selectedContact = contacts.find((c) => c.id_contact === form.id_contact);
  const getServiceName = (id: string) => services.find((s) => s.id_service === id)?.display_name ?? services.find((s) => s.id_service === id)?.name ?? id;

  const totalBeforeDiscount = form.serviceLines.reduce((sum, l) => {
    const lineTotal = l.units * l.price * (1 - l.discount_pct / 100);
    return sum + lineTotal;
  }, 0);
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

  useEffect(() => {
    if (step === 4) setCreateError(null);
  }, [step]);

  const handleCreateProposal = useCallback(async () => {
    setCreateError(null);
    setCreateSaving(true);
    try {
      const created = await ProposalService.createProposal({
        id_proposal: form.draft_id_proposal,
        id_customer: form.id_customer,
        id_contact: form.id_contact,
        additionalContactIds: form.additionalContactIds,
        agent: plyniumAgentName,
        title: form.title.trim(),
        proposal_date: form.proposal_date,
        expiration_date: form.expiration_date,
        amount_eur: totalAfterTax,
        general_discount_mode: form.general_discount_mode,
        general_discount_pct: form.general_discount_pct,
        general_discount_abs_eur: form.general_discount_abs_eur,
        serviceLines: form.serviceLines,
        payments: form.payments,
        isExchange: form.isExchange,
        exchangeHasFinalPrice: form.exchangeHasFinalPrice,
        exchangeFinalPrice: form.exchangeFinalPrice,
        exchangeHasBankTransfers: form.exchangeHasBankTransfers,
        exchangePlyniumTransferDate: form.exchangePlyniumTransferDate,
        exchangeCounterpartDate: form.exchangeCounterpartDate,
        exchangeTransferredAmount: form.exchangeTransferredAmount,
        exchangeToBeReceivedHtml: form.exchangeToBeReceivedHtml,
      });
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
  }, [
    form.draft_id_proposal,
    form.id_customer,
    form.id_contact,
    form.additionalContactIds,
    form.title,
    form.proposal_date,
    form.expiration_date,
    form.general_discount_mode,
    form.general_discount_pct,
    form.general_discount_abs_eur,
    form.serviceLines,
    form.payments,
    form.isExchange,
    form.exchangeHasFinalPrice,
    form.exchangeFinalPrice,
    form.exchangeHasBankTransfers,
    form.exchangePlyniumTransferDate,
    form.exchangeCounterpartDate,
    form.exchangeTransferredAmount,
    form.exchangeToBeReceivedHtml,
    plyniumAgentName,
    totalAfterTax,
    router,
  ]);

  const appendServiceLineFromPicker = useCallback(
    (
      service: ServiceRow,
      extra?: ServiceExtra,
      pref?: { preferential_slot_id: string; position_in_magazine: string }
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
      if (extra && "publicationLabel" in extra) {
        const label = String(extra.publicationLabel ?? "").trim();
        if (label) {
          description = baseDescription ? `${baseDescription}\n${label}` : label;
        }
      }
      if (pref?.position_in_magazine) {
        const pl = `Preferential placement: ${pref.position_in_magazine}`;
        description = description ? `${description}\n${pl}` : pl;
      }

      const price = service.tariff_price_eur;
      const newLine: ServiceLine = {
        lineId: `line-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        id_service: service.id_service,
        description,
        specifications: baseSpecifications,
        units: 1,
        discount_pct: 0,
        price,
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
        }),
        ...(pref
          ? { preferential_slot_id: pref.preferential_slot_id, position_in_magazine: pref.position_in_magazine }
          : {}),
      };
      if (extra && "calculatedPrice" in extra) newLine.price = extra.calculatedPrice;
      setForm((f) => ({
        ...f,
        serviceLines: [...f.serviceLines.slice(0, insertAtIndex), newLine, ...f.serviceLines.slice(insertAtIndex)],
      }));
    },
    [insertAtIndex]
  );

  const backUrl = "/logged/pages/account-management/proposals";

  const breadcrumbs = [
    { label: "Account management", href: "/logged/pages/account-management/customers_db" },
    { label: "Proposals", href: backUrl },
    { label: "New proposal" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "New proposal",
      breadcrumbs,
      buttons: [{ label: "Back", href: backUrl }],
    });
  }, [setPageMeta, breadcrumbs, backUrl]);

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
                onClick={() => s < step && setStep(s)}
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
        onConfirm={(service: ServiceRow, extra?: ServiceExtra) => {
          const gid = String(service.service_group_id ?? "").trim();
          const pubId =
            extra && typeof extra === "object" && "id_planned_publication" in extra
              ? String((extra as { id_planned_publication?: string }).id_planned_publication ?? "").trim()
              : "";
          if (isMagazinePreferentialTariffGroup(gid) && pubId && extra) {
            setPreferentialModal({ service, extra });
            return;
          }
          appendServiceLineFromPicker(service, extra);
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

export default function CreateProposalPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading…</div>}>
      <CreateProposalPageContent />
    </Suspense>
  );
}
