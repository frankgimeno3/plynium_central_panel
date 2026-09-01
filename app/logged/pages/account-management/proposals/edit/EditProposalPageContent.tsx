"use client";

import React, { FC, useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncPageMeta } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import ServiceSelectModal from "@/app/logged/logged_components/modals/ServiceSelectModal";
import type { ServiceRow, ServiceExtra } from "@/app/logged/logged_components/modals/ServiceSelectModal";
import type { ServiceLineDraft } from "@/app/logged/logged_components/modals/ServiceSelectModal/modal_service_select_components/types";
import { ServiceService } from "@/app/service/ServiceService";
import { CustomerService } from "@/app/service/CustomerService";
import { ContactService } from "@/app/service/ContactService";
import { ProposalService } from "@/app/service/ProposalService";
import Step2Products from "../create/components/Step2Products";
import Step3Payment from "../create/components/Step3Payment";
import Step4Review from "../create/components/Step4Review";
import type { Contact, Customer, ProposalForm, Service, ServiceLine } from "../create/components/types";
import { buildEditSavePayload } from "../create/buildDraftPayload";
import { proposalApiToForm, type LoadedProposalApi } from "../create/proposalWizardUtils";
import { getContributingServiceTotal, computeCalculatedServiceTotal } from "../create/serviceLinePricing";
import { getProposalDetailHref } from "@/lib/account-management/proposalRoutes";
import MagazinePreferentialAvailabilityModal from "../create/components/MagazinePreferentialAvailabilityModal";
import { isMagazinePreferentialTariffGroup } from "../create/components/magazinePreferentialConstants";

type EditStep = 2 | 3 | 4;

function normalizeServiceForProposalUi(raw: unknown): Service | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = String(r.id_service ?? r.service_id ?? "").trim();
  if (!id) return null;
  const name = String(r.name ?? r.service_full_name ?? "").trim() || id;
  const display =
    String(r.display_name ?? "").trim() || String(r.shown_name ?? "").trim() || name;
  const desc = String(r.description ?? r.service_description ?? "").trim();
  const specs = String(r.service_unit_specifications ?? "").trim();
  const tariff = Number(r.tariff_price_eur ?? r.service_unit_price ?? r.price ?? 0);
  return {
    id_service: id,
    name,
    display_name: display,
    description: desc,
    service_description: desc,
    service_unit_specifications: specs,
    tariff_price_eur: Number.isFinite(tariff) ? tariff : 0,
    unit: r.service_unit != null ? String(r.service_unit) : undefined,
  };
}

type Props = {
  editProposalId: string;
};

const EditProposalPageContent: FC<Props> = ({ editProposalId }) => {
  const router = useRouter();
  const proposalId = editProposalId.trim();
  const detailUrl = getProposalDetailHref(proposalId);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [proposalStatus, setProposalStatus] = useState<string>("pending");
  const [proposalTitle, setProposalTitle] = useState("");
  const [agentLabel, setAgentLabel] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [step, setStep] = useState<EditStep>(2);
  const [form, setForm] = useState<ProposalForm | null>(null);
  const [saveSaving, setSaveSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [insertAtIndex, setInsertAtIndex] = useState(0);
  const [preferentialModal, setPreferentialModal] = useState<{
    service: ServiceRow;
    extra: ServiceExtra;
  } | null>(null);

  /** Step components require non-null form; state stays nullable until load completes. */
  const updateForm = useCallback<React.Dispatch<React.SetStateAction<ProposalForm>>>(
    (value) => {
      setForm((prev) => {
        if (prev == null) return prev;
        return typeof value === "function" ? value(prev) : value;
      });
    },
    []
  );

  useEffect(() => {
    ServiceService.getAllServices()
      .then((list) => {
        const rows = Array.isArray(list) ? list : [];
        setServices(rows.map((x) => normalizeServiceForProposalUi(x)).filter(Boolean) as Service[]);
      })
      .catch(() => setServices([]));
    CustomerService.getAllCustomers()
      .then((l: Customer[]) => setCustomers(Array.isArray(l) ? l : []))
      .catch(() => setCustomers([]));
    ContactService.getAllContacts()
      .then((l: Contact[]) => setContacts(Array.isArray(l) ? l : []))
      .catch(() => setContacts([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const p = (await ProposalService.getProposalById(proposalId)) as LoadedProposalApi & {
          agent?: string;
        };
        if (cancelled) return;
        const status = String(p.status ?? "").trim().toLowerCase();
        if (status === "draft") {
          router.replace(`/logged/pages/account-management/proposals/create/${encodeURIComponent(proposalId)}`);
          return;
        }
        if (status === "accepted") {
          router.replace(detailUrl);
          return;
        }
        setProposalStatus(status);
        setProposalTitle(String(p.title ?? "").trim());
        setAgentLabel(String(p.agent ?? "").trim());
        setForm(proposalApiToForm(p));
        setStep(2);
      } catch (e: unknown) {
        if (cancelled) return;
        const ax = e as { response?: { data?: { message?: string } }; message?: string };
        setLoadError(
          ax?.response?.data?.message ||
            (e instanceof Error ? e.message : null) ||
            ax?.message ||
            "Could not load proposal."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [proposalId, router, detailUrl]);

  const selectedCustomer = form ? customers.find((c) => c.id_customer === form.id_customer) : undefined;
  const getServiceName = (id: string) =>
    services.find((s) => s.id_service === id)?.display_name ??
    services.find((s) => s.id_service === id)?.name?.replace(/_/g, " ") ??
    id;

  const totalBeforeDiscount = useMemo(() => {
    if (!form) return 0;
    return form.serviceLines.reduce((sum, l) => sum + getContributingServiceTotal(l), 0);
  }, [form]);

  const totalPreTax = useMemo(() => {
    if (!form) return 0;
    return form.general_discount_mode === "abs"
      ? Math.max(0, totalBeforeDiscount - (Number(form.general_discount_abs_eur) || 0))
      : totalBeforeDiscount * (1 - (Number(form.general_discount_pct) || 0) / 100);
  }, [form, totalBeforeDiscount]);

  const isSpain = (selectedCustomer?.country ?? "").toLowerCase() === "spain";
  const vatPct = isSpain ? 21 : 0;
  const totalAfterTax = totalPreTax * (1 + vatPct / 100);
  const paymentsSum = form?.payments.reduce((s, p) => s + p.amount, 0) ?? 0;
  const paymentsMatchTotal =
    (form?.isExchange || (form?.payments.length ?? 0) > 0) &&
    Math.abs(paymentsSum - totalAfterTax) < 0.01;
  const canAdvanceStep2 = (form?.serviceLines.length ?? 0) > 0;
  const canAdvanceStep3 = form?.isExchange || paymentsMatchTotal;

  const goToStep = (s: EditStep) => setStep(s);
  const goBack = () => {
    if (step === 3) goToStep(2);
    else if (step === 4) goToStep(3);
  };
  const goNext = () => {
    if (step === 2 && canAdvanceStep2) goToStep(3);
    else if (step === 3 && canAdvanceStep3) goToStep(4);
  };

  const appendServiceLineFromPicker = useCallback(
    (service: ServiceRow, extra?: ServiceExtra, pref?: { preferential_slot_id: string; position_in_magazine: string }, lineDraft?: ServiceLineDraft) => {
      if (!form) return;
      const unitPrice = lineDraft ? lineDraft.unit_price : service.tariff_price_eur;
      const discountPct = lineDraft ? lineDraft.discount_pct : 0;
      const units = lineDraft ? lineDraft.units : 1;
      const newLine: ServiceLine = {
        lineId: `line-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        id_service: service.id_service,
        description: lineDraft ? lineDraft.description : String(service.description ?? ""),
        specifications: lineDraft
          ? lineDraft.specifications
          : String((service as { service_unit_specifications?: string }).service_unit_specifications ?? ""),
        units,
        discount_pct: discountPct,
        unit_price: unitPrice,
        price: unitPrice,
        price_mode: "calculated",
        service_total_price: computeCalculatedServiceTotal(units, unitPrice, discountPct),
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
        newLine.service_total_price = computeCalculatedServiceTotal(newLine.units, extra.calculatedPrice, newLine.discount_pct);
      }
      updateForm((f) => ({
        ...f,
        serviceLines: [...f.serviceLines.slice(0, insertAtIndex), newLine, ...f.serviceLines.slice(insertAtIndex)],
      }));
    },
    [form, insertAtIndex, updateForm]
  );

  const handleSave = useCallback(async () => {
    if (!form) return;
    setSaveSaving(true);
    setSaveError(null);
    try {
      await ProposalService.updateProposal(proposalId, {
        ...buildEditSavePayload(form, totalAfterTax),
        status: proposalStatus,
      });
      router.push(detailUrl);
      router.refresh();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } }; message?: string };
      setSaveError(
        ax?.response?.data?.message ||
          (e instanceof Error ? e.message : null) ||
          ax?.message ||
          "Could not save changes."
      );
    } finally {
      setSaveSaving(false);
    }
  }, [form, proposalId, totalAfterTax, proposalStatus, router, detailUrl]);

  useSyncPageMeta({
    pageTitle: proposalTitle ? `Edit: ${proposalTitle}` : "Edit proposal",
    breadcrumbs: [
      { label: "Account management", href: "/logged/pages/account-management/customers_db" },
      { label: "Proposals", href: "/logged/pages/account-management/proposals" },
      { label: proposalTitle || proposalId, href: detailUrl },
      { label: "Edit services & payments" },
    ],
    buttons: [
      {
        label: "Back to proposal",
        href: detailUrl,
      },
    ],
  });

  if (loading) {
    return (
      <PageContentSection>
        <p className="p-6 text-gray-600">Loading proposal…</p>
      </PageContentSection>
    );
  }

  if (loadError || !form) {
    return (
      <PageContentSection>
        <div className="p-6 space-y-4">
          <p className="text-sm text-red-700" role="alert">
            {loadError ?? "Proposal not found."}
          </p>
          <Link href={detailUrl} className="text-blue-600 hover:underline text-sm font-medium">
            Back to proposal
          </Link>
        </div>
      </PageContentSection>
    );
  }

  return (
    <>
      <PageContentSection className="p-0">
        <div className="flex flex-col w-full">
          <div className="flex border-b border-gray-200 bg-gray-50 px-6 py-4 items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {([2, 3, 4] as EditStep[]).map((s, i) => (
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
                  {i < 2 && <span className="w-8 h-0.5 bg-gray-300" />}
                </React.Fragment>
              ))}
              <span className="text-sm text-gray-600 ml-2">
                {step === 2 && "Products"}
                {step === 3 && "Payment"}
                {step === 4 && "Review"}
              </span>
            </div>
            <Link href={detailUrl} className="text-sm font-medium text-blue-700 hover:underline shrink-0">
              Cancel — back to proposal
            </Link>
          </div>

          <div className="bg-white rounded-b-lg overflow-hidden p-6 md:p-8 w-full">
            {saveError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                {saveError}
              </div>
            )}

            {step === 2 && (
              <Step2Products
                form={form}
                setForm={updateForm}
                services={services}
                selectedCustomer={selectedCustomer}
                getServiceName={getServiceName}
                totalBeforeDiscount={totalBeforeDiscount}
                totalPreTax={totalPreTax}
                totalAfterTax={totalAfterTax}
                vatPct={vatPct}
                onBack={() => router.push(detailUrl)}
                onNext={goNext}
                canAdvance={canAdvanceStep2}
                onOpenServiceModalAt={(index) => {
                  setInsertAtIndex(index);
                  setServiceModalOpen(true);
                }}
              />
            )}

            {step === 3 && (
              <Step3Payment
                form={form}
                setForm={updateForm}
                totalAfterTax={totalAfterTax}
                paymentsSum={paymentsSum}
                paymentsMatchTotal={paymentsMatchTotal}
                onBack={goBack}
                onNext={goNext}
                canAdvance={canAdvanceStep3}
              />
            )}

            {step === 4 && (
              <Step4Review
                form={form}
                customers={customers}
                contacts={contacts}
                plyniumAgentName={agentLabel}
                getServiceName={getServiceName}
                totalBeforeDiscount={totalBeforeDiscount}
                totalPreTax={totalPreTax}
                totalAfterTax={totalAfterTax}
                vatPct={vatPct}
                paymentsSum={paymentsSum}
                paymentsMatchTotal={paymentsMatchTotal}
                onBack={goBack}
                onCreate={handleSave}
                createSaving={saveSaving}
                createError={saveError}
                submitLabel="Save changes"
                submitSavingLabel="Saving…"
              />
            )}
          </div>
        </div>
      </PageContentSection>

      <ServiceSelectModal
        open={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        onConfirm={(service, extra, lineDraft) => {
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
          if (isMagazinePreferentialTariffGroup(gid, service.name) && pubId && extra && !prefSlotId) {
            setPreferentialModal({ service, extra });
            return;
          }
          appendServiceLineFromPicker(
            service,
            extra,
            prefSlotId && prefPosition ? { preferential_slot_id: prefSlotId, position_in_magazine: prefPosition } : undefined,
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

export { EditProposalPageContent };
