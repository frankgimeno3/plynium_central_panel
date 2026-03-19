"use client";

import React, { FC, use, useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ServiceService } from "@/app/service/ServiceService";
import { CustomerService } from "@/app/service/CustomerService";
import { ContactService } from "@/app/service/ContactService";
import publicationsData from "@/app/contents/publications.json";
import { getPlanned } from "@/app/contents/publicationsHelpers";
import { ContractService } from "@/app/service/ContractService";

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

type Contract = {
  id_contract: string;
  id_proposal: string;
  id_customer: string;
  agent?: string;
  process_state: string;
  payment_state: string;
  title: string;
  amount_eur?: number;
};

type Project = {
  id_project: string;
  id_contract: string;
  title: string;
  status: string;
  service?: string;
  publication_date?: string;
  publication_id?: string;
};

type Service = { id_service: string; name: string; display_name?: string };
type Customer = { id_customer: string; name: string; country?: string };
type Contact = { id_contact: string; name: string; email?: string; id_customer?: string };
type PlannedPublication = { id_planned_publication: string; edition_name: string };

const plannedPublications = getPlanned(publicationsData as import("@/app/contents/interfaces").PublicationUnified[]) as PlannedPublication[];

const ContractDetailPage: FC<{ params: Promise<{ id_contract: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_contract } = use(params);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [contract, setContract] = useState<Contract | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    ServiceService.getAllServices().then((list) => setServices(Array.isArray(list) ? list : [])).catch(() => setServices([]));
  }, []);
  useEffect(() => {
    CustomerService.getAllCustomers().then((l: Customer[]) => setCustomers(Array.isArray(l) ? l : [])).catch(() => setCustomers([]));
    ContactService.getAllContacts().then((l: Contact[]) => setContacts(Array.isArray(l) ? l : [])).catch(() => setContacts([]));
  }, []);
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ContractService.getContractById(id_contract);
      setContract(data?.contract ?? null);
      setProposal(data?.proposal ?? null);
      setProjects(Array.isArray(data?.projects) ? data.projects : []);
    } catch {
      setContract(null);
      setProposal(null);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [id_contract]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  const customer = (proposal ?? contract) ? customers.find((c) => c.id_customer === (proposal?.id_customer ?? contract!.id_customer)) : null;
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
    if (contract) {
      setPageMeta({
        pageTitle: `Contract: ${proposal?.title ?? contract.title}`,
        breadcrumbs: [
          { label: "Account management", href: "/logged/pages/account-management/customers_db" },
          { label: "Contracts", href: "/logged/pages/account-management/contracts" },
          { label: proposal?.title ?? contract.title },
        ],
        buttons: [{ label: "Back to Contracts", href: "/logged/pages/account-management/contracts" }],
      });
    } else {
      setPageMeta({
        pageTitle: "Contract not found",
        breadcrumbs: [
          { label: "Account management", href: "/logged/pages/account-management/customers_db" },
          { label: "Contracts", href: "/logged/pages/account-management/contracts" },
        ],
        buttons: [{ label: "Back to Contracts", href: "/logged/pages/account-management/contracts" }],
      });
    }
  }, [setPageMeta, contract, proposal]);

  if (!contract) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
            <p className="text-gray-500">{loading ? "Loading contract…" : "Contract not found."}</p>
          </div>
        </div>
      </PageContentSection>
    );
  }

  const displayTitle = proposal?.title ?? contract.title;
  const displayAmount = lines.length ? totalAfterTax : (contract.amount_eur ?? proposal?.amount_eur ?? 0);
  const displayDate = proposal?.proposal_date ?? proposal?.date_created ?? "";
  const displayAgent = proposal?.agent ?? contract.agent ?? "";

  return (
    <PageContentSection>
      <div className="flex flex-col w-full">
        <div className="bg-white rounded-b-lg overflow-hidden p-6 space-y-6">
        {/* Contract title (from accepted proposal) */}
        <input
          type="text"
          readOnly
          value={displayTitle}
          className="w-full px-4 py-3 text-xl font-semibold text-gray-900 border-2 border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Contract title"
        />

        {/* By agent, For, From the company */}
        <div className="space-y-1 text-sm text-gray-700">
          {displayAgent && (
            <p><span className="text-gray-500">By agent</span> {displayAgent}</p>
          )}
          {(contact || proposal?.id_contact) && (
            <p><span className="text-gray-500">For</span> {contact?.name ?? proposal?.id_contact} {contact?.email ? `(${contact.email})` : ""}</p>
          )}
          {(customer || contract.id_customer) && (
            <p><span className="text-gray-500">From the company</span>{" "}
              {customer ? (
                <Link href={`/logged/pages/account-management/customers_db/${customer.id_customer}`} className="text-blue-600 hover:underline font-medium">
                  {customer.name}
                </Link>
              ) : (
                <span className="font-medium">{contract.id_customer}</span>
              )}
            </p>
          )}
        </div>

        {/* Contract & proposal metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Contract ID</p>
            <p className="font-medium">{contract.id_contract}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Proposal</p>
            <Link href={`/logged/pages/account-management/proposals/${contract.id_proposal}`} className="text-blue-600 hover:underline font-medium">
              {contract.id_proposal}
            </Link>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Process state</p>
            <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${contract.process_state === "active" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>
              {contract.process_state}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Payment state</p>
            <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${contract.payment_state === "paid" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
              {contract.payment_state}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Amount (€)</p>
            <p className="font-medium">{Number(displayAmount)?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Proposal date</p>
            <p className="font-medium">{displayDate || "—"}</p>
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

        {/* Services offered (from proposal – become projects to execute) */}
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

        {/* Legacy servicesArray (when proposal has no serviceLines) */}
        {lines.length === 0 && proposal?.servicesArray && proposal.servicesArray.length > 0 && (
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

        {/* Projects (services converted to projects to execute) */}
        <div className="border-t pt-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Projects ({projects.length})</p>
          <p className="text-xs text-gray-500 mb-3">Services from this contract to be executed.</p>
          <div className="space-y-2">
            {projects.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No projects linked yet.</p>
            ) : (
              projects.map((p) => (
                <div
                  key={p.id_project}
                  onClick={() => router.push(`/logged/pages/account-management/projects/${contract.id_contract}`)}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50/80 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{p.title}</p>
                    <p className="text-sm text-gray-500">
                      {p.service ? getServiceName(p.service) : "—"}
                      {p.publication_date ? ` · ${p.publication_date}` : ""}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${p.status === "published" ? "bg-green-100 text-green-800" : p.status === "ok_production" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>
                    {p.status.replace(/_/g, " ")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payments (from proposal) */}
        {proposal && !proposal.isExchange && proposal.payments && proposal.payments.length > 0 && (
          <div className="border-t pt-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Payment method</p>
            <ul className="space-y-2 text-sm">
              {proposal.payments.map((pay) => (
                <li key={pay.paymentId} className="flex justify-between items-center py-1">
                  <span>
                    {pay.date} — {pay.paymentMethod === "recibo" ? "Direct debit" : "Bank transfer"} — {pay.bank}
                  </span>
                  <span className="font-medium">{pay.amount.toFixed(2)} €</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-600 mt-2 text-right">Total payments: <strong>{paymentsSum.toFixed(2)} €</strong></p>
          </div>
        )}

        {/* Exchange terms (from proposal) */}
        {proposal?.isExchange && (
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

        {/* Fallback when no proposal found */}
        {!proposal && customer && (
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

export default ContractDetailPage;
