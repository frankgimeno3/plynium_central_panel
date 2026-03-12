"use client";

import React, { FC, use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import proposalsData from "@/app/contents/proposals.json";
import customersData from "@/app/contents/customers.json";
import contactsData from "@/app/contents/contactsContents.json";
import servicesData from "@/app/contents/servicesContents.json";
import plannedPublicationsData from "@/app/contents/planned_publications.json";

type ServiceLine = {
  lineId: string;
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
  paymentId: string;
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
type PlannedPublication = { id_planned_publication: string; edition_name: string };

const services = servicesData as Service[];
const customers = customersData as Customer[];
const contacts = contactsData as Contact[];
const plannedPublications = plannedPublicationsData as PlannedPublication[];

const ProposalDetailPage: FC<{ params: Promise<{ id_proposal: string }> }> = ({ params }) => {
  const { id_proposal } = use(params);
  const proposal = (proposalsData as Proposal[]).find((p) => p.id_proposal === id_proposal);

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
  const getPublicationName = (id: string) => plannedPublications.find((p) => p.id_planned_publication === id)?.edition_name ?? id;

  const lines = proposal?.serviceLines ?? [];
  const totalBeforeDiscount = useMemo(
    () => lines.reduce((sum, l) => sum + l.units * l.price * (1 - (l.discount_pct ?? 0) / 100), 0),
    [lines]
  );
  const generalDiscountPct = proposal?.general_discount_pct ?? 0;
  const totalPreTax = totalBeforeDiscount * (1 - generalDiscountPct / 100);
  const isSpain = (customer?.country ?? "").toLowerCase() === "spain";
  const vatPct = isSpain ? 21 : 0;
  const totalAfterTax = totalPreTax * (1 + vatPct / 100);
  const paymentsSum = (proposal?.payments ?? []).reduce((s, p) => s + p.amount, 0);

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
            <p className="text-gray-500">Proposal not found.</p>
          </div>
        </div>
      </PageContentSection>
    );
  }

  const displayAmount = proposal.serviceLines?.length ? totalAfterTax : proposal.amount_eur;
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
          className="w-full px-4 py-3 text-xl font-semibold text-gray-900 border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Estimated expiration date</label>
            <input
              type="date"
              value={editableExpirationDate}
              onChange={(e) => setEditableExpirationDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {isExpired && (
              <p className="text-xs text-red-600 mt-1">This proposal is considered expired (expiration date has passed).</p>
            )}
          </div>
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
                  {lines.map((line) => {
                    const lineTotal = line.units * line.price * (1 - (line.discount_pct ?? 0) / 100);
                    const extra: string[] = [];
                    if (line.publicationMonth != null && line.publicationYear != null) extra.push(`${line.publicationMonth}/${line.publicationYear}`);
                    if (line.startDate && line.endDate) extra.push(`${line.startDate} – ${line.endDate}`);
                    if (line.id_planned_publication) extra.push(getPublicationName(line.id_planned_publication) + (line.magazinePageType ? ` · ${line.magazinePageType}` : ""));
                    return (
                      <tr key={line.lineId}>
                        <td className="px-4 py-2">{getServiceName(line.id_service)}</td>
                        <td className="px-4 py-2">{line.description || "—"}</td>
                        <td className="px-4 py-2">{line.specifications || "—"}</td>
                        <td className="px-4 py-2 text-right">{line.units}</td>
                        <td className="px-4 py-2 text-right">{line.discount_pct ?? 0}%</td>
                        <td className="px-4 py-2 text-right">{line.price} €</td>
                        <td className="px-4 py-2 text-right">{lineTotal.toFixed(2)} €</td>
                        <td className="px-4 py-2 text-gray-600">{extra.join(" · ") || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-1 text-sm text-right">
              <div>Total before discount: <strong>{totalBeforeDiscount.toFixed(2)} €</strong></div>
              <div>General discount {generalDiscountPct}%: <strong>{totalPreTax.toFixed(2)} €</strong> (pre-tax)</div>
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
        {!proposal.isExchange && proposal.payments && proposal.payments.length > 0 && (
          <div className="border-t pt-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Payment method</p>
            <ul className="space-y-2 text-sm">
              {proposal.payments.map((p) => (
                <li key={p.paymentId} className="flex justify-between items-center py-1">
                  <span>
                    {p.date} — {p.paymentMethod === "recibo" ? "Direct debit" : "Bank transfer"} — {p.bank}
                  </span>
                  <span className="font-medium">{p.amount.toFixed(2)} €</span>
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
      </div>
    </PageContentSection>
  );
};

export default ProposalDetailPage;
