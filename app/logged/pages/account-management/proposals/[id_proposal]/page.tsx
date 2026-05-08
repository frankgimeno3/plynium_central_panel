"use client";

import React, { FC, use, useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ServiceService } from "@/app/service/ServiceService";
import { CustomerService } from "@/app/service/CustomerService";
import { ContactService } from "@/app/service/ContactService";
import { PublicationService } from "@/app/service/PublicationService";
import { ProposalService } from "@/app/service/ProposalService";

type ServiceLine = {
  lineId?: string;
  id_service: string;
  description: string;
  specifications: string;
  units: number;
  discount_pct: number;
  price: number;
  publicationMonth?: number;
  publicationYear?: number;
  startDate?: string;
  endDate?: string;
  id_planned_publication?: string;
  magazinePageType?: string;
  magazineSlotKey?: string;
};

type PaymentLine = {
  paymentId?: string;
  date: string;
  paymentMethod: "recibo" | "transferencia_bancaria";
  bank: "Sabadell" | "Santander";
  amount: number;
};

type Proposal = {
  id_proposal: string;
  id_customer: string;
  id_contact?: string;
  additionalContactIds?: string[];
  agent?: string;
  status: string;
  title: string;
  proposal_date?: string;
  date_created: string;
  expiration_date?: string;
  amount_eur: number;
  general_discount_pct?: number;
  serviceLines?: ServiceLine[];
  servicesArray?: { id_service: string; price: number; description: string }[];
  payments?: PaymentLine[];
  isExchange?: boolean;
  exchangeHasFinalPrice?: boolean;
  exchangeFinalPrice?: number;
  exchangeHasBankTransfers?: boolean;
  exchangePlyniumTransferDate?: string;
  exchangeCounterpartDate?: string;
  exchangeTransferredAmount?: number;
  exchangeToBeReceivedHtml?: string;
};

type Service = { id_service: string; name: string; display_name?: string };
type Customer = { id_customer: string; name: string; country?: string };
type Contact = { id_contact: string; name: string; email?: string; id_customer?: string };
type PublicationRow = { id_publication: string; edition_name?: string };

const ProposalDetailPage: FC<{ params: Promise<{ id_proposal: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_proposal } = use(params);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [publications, setPublications] = useState<PublicationRow[]>([]);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [editableLines, setEditableLines] = useState<ServiceLine[]>([]);
  const [editablePayments, setEditablePayments] = useState<PaymentLine[]>([]);
  const [editableGeneralDiscount, setEditableGeneralDiscount] = useState(0);
  const [saveSaving, setSaveSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [acceptContractTitle, setAcceptContractTitle] = useState("");
  const [acceptSaving, setAcceptSaving] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  useEffect(() => {
    ServiceService.getAllServices().then((list) => setServices(Array.isArray(list) ? list : [])).catch(() => setServices([]));
  }, []);
  useEffect(() => {
    PublicationService.getAllPublications()
      .then((list: any[]) => {
        const rows = Array.isArray(list) ? list : [];
        setPublications(
          rows
            .filter((x) => x && typeof x === "object")
            .map((x: any) => ({
              id_publication: String(x.id_publication ?? x.publication_id ?? x.id ?? "").trim(),
              edition_name: x.edition_name != null ? String(x.edition_name) : undefined,
            }))
            .filter((p) => p.id_publication.length > 0)
        );
      })
      .catch(() => setPublications([]));
  }, []);
  useEffect(() => {
    CustomerService.getAllCustomers().then((l: Customer[]) => setCustomers(Array.isArray(l) ? l : [])).catch(() => setCustomers([]));
    ContactService.getAllContacts().then((l: Contact[]) => setContacts(Array.isArray(l) ? l : [])).catch(() => setContacts([]));
  }, []);
  const loadProposal = useCallback(async () => {
    setLoading(true);
    try {
      const p = await ProposalService.getProposalById(id_proposal);
      setProposal(p ?? null);
      if (p) {
        setEditableLines((p.serviceLines ?? []).map((l: ServiceLine) => ({ ...l })));
        setEditablePayments((p.payments ?? []).map((x: PaymentLine) => ({ ...x })));
        setEditableGeneralDiscount(p.general_discount_pct ?? 0);
      } else {
        setEditableLines([]);
        setEditablePayments([]);
        setEditableGeneralDiscount(0);
      }
    } catch {
      setProposal(null);
      setEditableLines([]);
      setEditablePayments([]);
      setEditableGeneralDiscount(0);
    } finally {
      setLoading(false);
    }
  }, [id_proposal]);

  useEffect(() => {
    loadProposal();
  }, [loadProposal]);

  const creationDateFromData = proposal?.proposal_date ?? proposal?.date_created ?? "";
  const expirationDateFromData = proposal?.expiration_date ?? (() => {
    if (!creationDateFromData) return "";
    const d = new Date(creationDateFromData);
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().slice(0, 10);
  })();

  const [editableTitle, setEditableTitle] = useState(proposal?.title ?? "");
  const [editableCreationDate, setEditableCreationDate] = useState(creationDateFromData);
  const [editableExpirationDate, setEditableExpirationDate] = useState(expirationDateFromData);

  useEffect(() => {
    if (proposal?.title != null) setEditableTitle(proposal.title);
  }, [proposal?.title]);
  useEffect(() => {
    setEditableCreationDate(creationDateFromData);
    setEditableExpirationDate(expirationDateFromData);
  }, [creationDateFromData, expirationDateFromData]);

  const isExpired = useMemo(() => {
    if (!editableExpirationDate) return false;
    return new Date(editableExpirationDate) < new Date(new Date().toISOString().slice(0, 10));
  }, [editableExpirationDate]);

  const customer = proposal ? customers.find((c) => c.id_customer === proposal.id_customer) : null;
  const contact = proposal?.id_contact ? contacts.find((c) => c.id_contact === proposal.id_contact) : null;
  const additionalContacts = useMemo(
    () => (proposal?.additionalContactIds ?? []).map((id) => contacts.find((c) => c.id_contact === id)).filter(Boolean) as Contact[],
    [proposal?.additionalContactIds]
  );

  const getServiceName = (id: string) => services.find((s) => s.id_service === id)?.display_name ?? services.find((s) => s.id_service === id)?.name?.replace(/_/g, " ") ?? id;
  const getPublicationName = (id: string) => publications.find((p) => p.id_publication === id)?.edition_name ?? id;

  const lines = editableLines;
  const totalBeforeDiscount = useMemo(
    () => lines.reduce((sum, l) => sum + l.units * l.price * (1 - (l.discount_pct ?? 0) / 100), 0),
    [lines]
  );
  const generalDiscountPct = editableGeneralDiscount;
  const totalPreTax = totalBeforeDiscount * (1 - generalDiscountPct / 100);
  const isSpain = (customer?.country ?? "").toLowerCase() === "spain";
  const vatPct = isSpain ? 21 : 0;
  const totalAfterTax = totalPreTax * (1 + vatPct / 100);
  const paymentsSum = (!proposal?.isExchange ? editablePayments : (proposal?.payments ?? [])).reduce((s, p) => s + p.amount, 0);

  const buildProposalPatch = useCallback((): Record<string, unknown> => {
    if (!proposal) return {};
    const body: Record<string, unknown> = {
      title: editableTitle,
      date_created: editableCreationDate,
      proposal_date: editableCreationDate,
      expiration_date: editableExpirationDate || null,
      general_discount_pct: editableGeneralDiscount,
      serviceLines: editableLines,
    };
    if (!proposal.isExchange) {
      body.payments = editablePayments;
    }
    return body;
  }, [
    proposal,
    editableTitle,
    editableCreationDate,
    editableExpirationDate,
    editableGeneralDiscount,
    editableLines,
    editablePayments,
  ]);

  const updateLine = useCallback((idx: number, patch: Partial<ServiceLine>) => {
    setEditableLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }, []);

  const updatePayment = useCallback((idx: number, patch: Partial<PaymentLine>) => {
    setEditablePayments((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }, []);

  const handleSave = useCallback(async () => {
    if (!proposal) return;
    setSaveSaving(true);
    setSaveError(null);
    try {
      await ProposalService.updateProposal(id_proposal, buildProposalPatch());
      await loadProposal();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "message" in e && typeof (e as { message: unknown }).message === "string"
          ? (e as { message: string }).message
          : null;
      setSaveError(msg || "No se pudo guardar.");
    } finally {
      setSaveSaving(false);
    }
  }, [proposal, id_proposal, buildProposalPatch, loadProposal]);

  const handleConfirmAccept = useCallback(async () => {
    if (!proposal) return;
    const contractTitle = acceptContractTitle.trim();
    if (!contractTitle) {
      setAcceptError("Indica un nombre para el contrato.");
      return;
    }
    setAcceptSaving(true);
    setAcceptError(null);
    try {
      await ProposalService.updateProposal(id_proposal, buildProposalPatch());
      const result = await ProposalService.acceptProposal(id_proposal, { contract_title: contractTitle });
      setAcceptModalOpen(false);
      setProposal(result.proposal);
      if (result?.contract?.id_contract) {
        router.push(`/logged/pages/account-management/contracts/${encodeURIComponent(result.contract.id_contract)}`);
      } else {
        await loadProposal();
      }
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "message" in e && typeof (e as { message: unknown }).message === "string"
          ? (e as { message: string }).message
          : null;
      setAcceptError(msg || "No se pudo aceptar la propuesta.");
    } finally {
      setAcceptSaving(false);
    }
  }, [proposal, id_proposal, router, loadProposal, buildProposalPatch, acceptContractTitle]);

  const { setPageMeta } = usePageContent();

  useEffect(() => {
    if (proposal) {
      setPageMeta({
        pageTitle: `Proposal: ${editableTitle || proposal.title}`,
        breadcrumbs: [
          { label: "Account management", href: "/logged/pages/account-management/customers_db" },
          { label: "Proposals", href: "/logged/pages/account-management/proposals" },
          { label: editableTitle || proposal.title },
        ],
        buttons: [{ label: "Back to Proposals", href: "/logged/pages/account-management/proposals" }],
      });
    } else {
      setPageMeta({
        pageTitle: "Proposal not found",
        breadcrumbs: [
          { label: "Account management", href: "/logged/pages/account-management/customers_db" },
          { label: "Proposals", href: "/logged/pages/account-management/proposals" },
        ],
        buttons: [{ label: "Back to Proposals", href: "/logged/pages/account-management/proposals" }],
      });
    }
  }, [setPageMeta, proposal, editableTitle]);

  if (!proposal) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
            <p className="text-gray-500">{loading ? "Loading proposal…" : "Proposal not found."}</p>
          </div>
        </div>
      </PageContentSection>
    );
  }

  const locked = proposal.status === "accepted";
  const displayAmount = lines.length ? totalAfterTax : proposal.amount_eur;
  const displayDate = proposal.proposal_date ?? proposal.date_created;

  return (
    <PageContentSection>
      <div className="flex flex-col w-full">
        <div className="bg-white rounded-b-lg overflow-hidden p-6 space-y-6">
        {/* Proposal title (editable) */}
        <input
          type="text"
          value={editableTitle}
          onChange={(e) => setEditableTitle(e.target.value)}
          disabled={locked}
          className="w-full px-4 py-3 text-xl font-semibold text-gray-900 border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Proposal title"
        />

        {/* By agent, For, From the company */}
        <div className="space-y-1 text-sm text-gray-700">
          {proposal.agent != null && proposal.agent !== "" && (
            <p><span className="text-gray-500">By agent</span> {proposal.agent}</p>
          )}
          {(contact || proposal.id_contact) && (
            <p><span className="text-gray-500">For</span> {contact?.name ?? proposal.id_contact} {contact?.email ? `(${contact.email})` : ""}</p>
          )}
          {(customer || proposal.id_customer) && (
            <p><span className="text-gray-500">From the company</span>{" "}
              {customer ? (
                <Link href={`/logged/pages/account-management/customers_db/${customer.id_customer}`} className="text-blue-600 hover:underline font-medium">
                  {customer.name}
                </Link>
              ) : (
                <span className="font-medium">{proposal.id_customer}</span>
              )}
            </p>
          )}
        </div>

        {/* Header: ID, Status, Amount, Dates */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">ID</p>
            <p className="font-medium">{proposal.id_proposal}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Status</p>
            <span
              className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                isExpired
                  ? "bg-red-100 text-red-800"
                  : proposal.status === "accepted"
                    ? "bg-green-100 text-green-800"
                    : proposal.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
              }`}
            >
              {isExpired ? "expired" : proposal.status}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Amount (€)</p>
            <p className="font-medium">{displayAmount?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Proposal date</p>
            <p className="font-medium">{displayDate}</p>
          </div>
        </div>

        {/* Editable: Creation date, Estimated expiration date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Creation date</label>
            <input
              type="date"
              value={editableCreationDate}
              onChange={(e) => setEditableCreationDate(e.target.value)}
              disabled={locked}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Estimated expiration date</label>
            <input
              type="date"
              value={editableExpirationDate}
              onChange={(e) => setEditableExpirationDate(e.target.value)}
              disabled={locked}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {isExpired && (
              <p className="text-xs text-red-600 mt-1">This proposal is considered expired (expiration date has passed).</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={locked || saveSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveSaving ? "Guardando…" : "Guardar cambios"}
          </button>
          {lines.length > 0 && !locked && (
            <button
              type="button"
              onClick={() => {
                setAcceptError(null);
                setAcceptContractTitle(editableTitle.trim() || proposal.title || "");
                setAcceptModalOpen(true);
              }}
              disabled={acceptSaving || saveSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Marcar como aceptada
            </button>
          )}
          {saveError && <p className="text-sm text-red-600 w-full">{saveError}</p>}
        </div>

        {additionalContacts.length > 0 && (
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="md:col-span-2">
              <dt className="text-gray-500">Additional contacts</dt>
              <dd className="font-medium">{additionalContacts.map((c) => c.name).join(", ")}</dd>
            </div>
          </dl>
        )}

        {/* Service lines (new structure) */}
        {lines.length > 0 && (
          <div className="border-t pt-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Services offered</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Service</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Description</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Specifications</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Units</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Disc. %</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Price</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Amount</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Extra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lines.map((line, idx) => {
                    const lineTotal = line.units * line.price * (1 - (line.discount_pct ?? 0) / 100);
                    const extra: string[] = [];
                    if (line.publicationMonth != null && line.publicationYear != null) extra.push(`${line.publicationMonth}/${line.publicationYear}`);
                    if (line.startDate && line.endDate) extra.push(`${line.startDate} – ${line.endDate}`);
                    if (line.id_planned_publication) extra.push(getPublicationName(line.id_planned_publication) + (line.magazinePageType ? ` · ${line.magazinePageType}` : ""));
                    const rowKey = line.lineId || `${line.id_service ?? "svc"}-${idx}`;
                    const cellInput =
                      "w-full min-w-[5rem] px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed";
                    return (
                      <tr key={rowKey}>
                        <td className="px-4 py-2 whitespace-nowrap">{getServiceName(line.id_service)}</td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={line.description ?? ""}
                            onChange={(e) => updateLine(idx, { description: e.target.value })}
                            disabled={locked}
                            className={cellInput}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={line.specifications ?? ""}
                            onChange={(e) => updateLine(idx, { specifications: e.target.value })}
                            disabled={locked}
                            className={cellInput}
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={Number.isFinite(line.units) ? line.units : 0}
                            onChange={(e) => updateLine(idx, { units: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                            disabled={locked}
                            className={`${cellInput} text-right`}
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            value={line.discount_pct ?? 0}
                            onChange={(e) => updateLine(idx, { discount_pct: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) })}
                            disabled={locked}
                            className={`${cellInput} text-right`}
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={line.price}
                            onChange={(e) => updateLine(idx, { price: Math.max(0, parseFloat(e.target.value) || 0) })}
                            disabled={locked}
                            className={`${cellInput} text-right`}
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-medium">{lineTotal.toFixed(2)} €</td>
                        <td className="px-4 py-2 text-gray-600 text-xs">{extra.join(" · ") || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm text-right">
              <div>Total before discount: <strong>{totalBeforeDiscount.toFixed(2)} €</strong></div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span>General discount (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={editableGeneralDiscount}
                  onChange={(e) => setEditableGeneralDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  disabled={locked}
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-right disabled:bg-gray-100"
                />
              </div>
              <div>After general discount (pre-tax): <strong>{totalPreTax.toFixed(2)} €</strong></div>
              {vatPct > 0 && <div>VAT {vatPct}%: <strong>{(totalAfterTax - totalPreTax).toFixed(2)} €</strong></div>}
              <p className="mt-2 text-lg font-semibold">Total after tax: {totalAfterTax.toFixed(2)} €</p>
            </div>
          </div>
        )}

        {/* Legacy servicesArray */}
        {lines.length === 0 && proposal.servicesArray && proposal.servicesArray.length > 0 && (
          <div className="border-t pt-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Services offered</p>
            <div className="space-y-3">
              {proposal.servicesArray.map((svc, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg flex justify-between items-start">
                  <div>
                    <span className="font-medium text-gray-900">{getServiceName(svc.id_service)}</span>
                    <p className="text-sm text-gray-600 mt-1">{svc.description}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{svc.price?.toLocaleString()} €</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2 text-right">Amount: <strong>{proposal.amount_eur?.toLocaleString()} €</strong></p>
          </div>
        )}

        {/* Payments */}
        {!proposal.isExchange && editablePayments.length > 0 && (
          <div className="border-t pt-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Payment method</p>
            <ul className="space-y-3 text-sm">
              {editablePayments.map((p, idx) => (
                <li
                  key={p.paymentId || `payment-${idx}`}
                  className="flex flex-wrap gap-3 items-end py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Date</label>
                    <input
                      type="date"
                      value={p.date ? p.date.slice(0, 10) : ""}
                      onChange={(e) => updatePayment(idx, { date: e.target.value })}
                      disabled={locked}
                      className="px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Method</label>
                    <select
                      value={p.paymentMethod}
                      onChange={(e) =>
                        updatePayment(idx, { paymentMethod: e.target.value as PaymentLine["paymentMethod"] })
                      }
                      disabled={locked}
                      className="px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                    >
                      <option value="recibo">Direct debit</option>
                      <option value="transferencia_bancaria">Bank transfer</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Bank</label>
                    <select
                      value={p.bank}
                      onChange={(e) => updatePayment(idx, { bank: e.target.value as PaymentLine["bank"] })}
                      disabled={locked}
                      className="px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                    >
                      <option value="Sabadell">Sabadell</option>
                      <option value="Santander">Santander</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Amount (€)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={p.amount}
                      onChange={(e) => updatePayment(idx, { amount: Math.max(0, parseFloat(e.target.value) || 0) })}
                      disabled={locked}
                      className="w-28 px-2 py-1 border border-gray-300 rounded text-sm text-right disabled:bg-gray-100"
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-600 mt-2 text-right">Total payments: <strong>{paymentsSum.toFixed(2)} €</strong></p>
          </div>
        )}

        {/* Exchange terms */}
        {proposal.isExchange && (
          <div className="border-t pt-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Exchange terms</p>
            {proposal.exchangeHasBankTransfers && (
              <div className="text-sm text-gray-600 space-y-1 mb-3">
                <p>Plynium transfer date: {proposal.exchangePlyniumTransferDate || "—"}</p>
                <p>Counterpart exchange date: {proposal.exchangeCounterpartDate || "—"}</p>
                <p>Transferred amount: {proposal.exchangeTransferredAmount != null ? `${proposal.exchangeTransferredAmount.toFixed(2)} €` : "—"}</p>
              </div>
            )}
            {proposal.exchangeToBeReceivedHtml && (
              <div className="text-sm">
                <p className="text-gray-600 mb-1">To be received in exchange for our advertisement:</p>
                <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: proposal.exchangeToBeReceivedHtml }} />
              </div>
            )}
          </div>
        )}

        {/* Customer link (when no service lines, keep legacy block) */}
        {customer && lines.length === 0 && !proposal.servicesArray?.length && (
          <div className="border-t pt-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Customer</p>
            <Link href={`/logged/pages/account-management/customers_db/${customer.id_customer}`} className="text-blue-600 hover:underline">
              {customer.name}
            </Link>
          </div>
        )}
        </div>

        {acceptModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            role="presentation"
            onClick={() => !acceptSaving && setAcceptModalOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && !acceptSaving && setAcceptModalOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="accept-proposal-title"
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <h2 id="accept-proposal-title" className="text-lg font-semibold text-gray-900">
                ¿Confirmar aceptación?
              </h2>
              <p className="text-sm text-gray-600">
                Se guardarán los cambios pendientes, la propuesta pasará a estado <strong>accepted</strong> y se creará{" "}
                <strong>un contrato</strong> con el nombre indicado abajo, con <strong>un proyecto por cada línea de servicio</strong>{" "}
                en <code className="text-xs bg-gray-100 px-1 rounded">contracts_db</code> y{" "}
                <code className="text-xs bg-gray-100 px-1 rounded">projects_db</code>.
              </p>
              <div className="space-y-1">
                <label htmlFor="accept-contract-title" className="block text-sm font-medium text-gray-700">
                  Nombre del contrato
                </label>
                <input
                  id="accept-contract-title"
                  type="text"
                  value={acceptContractTitle}
                  onChange={(e) => setAcceptContractTitle(e.target.value)}
                  maxLength={255}
                  disabled={acceptSaving}
                  placeholder="Ej. Contrato publicidad Q2 2026"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500">Máx. 255 caracteres. Los títulos de proyecto se generan a partir de este nombre.</p>
              </div>
              {acceptError && <p className="text-sm text-red-600">{acceptError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  disabled={acceptSaving}
                  onClick={() => setAcceptModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  disabled={acceptSaving || !acceptContractTitle.trim()}
                  onClick={() => void handleConfirmAccept()}
                >
                  {acceptSaving ? "Procesando…" : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContentSection>
  );
};

export default ProposalDetailPage;
