"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import CustomerSelectModal from "@/app/logged/logged_components/modals/CustomerSelectModal";
import ContactSelectModal from "@/app/logged/logged_components/modals/ContactSelectModal";
import ServiceSelectModal from "@/app/logged/logged_components/modals/ServiceSelectModal";
import type { ServiceRow, ServiceExtra } from "@/app/logged/logged_components/modals/ServiceSelectModal";
import { RichTextEditor } from "@/app/logged/logged_components/RichTextEditor";
import customersData from "@/app/contents/customers.json";
import contactsData from "@/app/contents/contactsContents.json";
import servicesData from "@/app/contents/servicesContents.json";

type Customer = { id_customer: string; name: string; country?: string; contact?: { name: string; role: string; email: string; phone: string } };
type Contact = { id_contact: string; name: string; role?: string; email: string; phone: string; id_customer?: string; company_name?: string };
type Service = { id_service: string; name: string; display_name?: string; description: string; tariff_price_eur: number; unit?: string };

export type ServiceLine = {
  lineId: string;
  id_service: string;
  description: string;
  specifications: string;
  units: number;
  discount_pct: number;
  price: number;
  /** Newsletter: month/year */
  publicationMonth?: number;
  publicationYear?: number;
  /** Portal banner / premium: date range */
  startDate?: string;
  endDate?: string;
  /** Magazine: publication + page type */
  id_planned_publication?: string;
  magazinePageType?: string;
  magazineSlotKey?: string;
};

type Step = 1 | 2 | 3 | 4;

export type PaymentLine = {
  paymentId: string;
  date: string;
  paymentMethod: "recibo" | "transferencia_bancaria";
  bank: "Sabadell" | "Santander";
  amount: number;
};

type ProposalForm = {
  id_customer: string;
  id_contact: string;
  additionalContactIds: string[];
  title: string;
  proposal_date: string;
  expiration_date: string;
  serviceLines: ServiceLine[];
  general_discount_pct: number;
  payments: PaymentLine[];
  /** Exchange mode: if true, show exchange terms instead of payments */
  isExchange: boolean;
  /** When isExchange: final exchange price toggle + value */
  exchangeHasFinalPrice: boolean;
  exchangeFinalPrice: number;
  /** When isExchange: bank transfer exchange */
  exchangeHasBankTransfers: boolean;
  exchangePlyniumTransferDate: string;
  exchangeCounterpartDate: string;
  exchangeTransferredAmount: number;
  /** Rich text: "To be received in exchange for our advertisement" */
  exchangeToBeReceivedHtml: string;
};

const customers = customersData as Customer[];
const contacts = contactsData as Contact[];
const services = servicesData as Service[];

const CreateProposalPage: FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<ProposalForm>({
    id_customer: "",
    id_contact: "",
    additionalContactIds: [],
    title: "",
    proposal_date: new Date().toISOString().slice(0, 10),
    expiration_date: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 2);
      return d.toISOString().slice(0, 10);
    })(),
    serviceLines: [],
    general_discount_pct: 0,
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
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [additionalContactModalOpen, setAdditionalContactModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [insertAtIndex, setInsertAtIndex] = useState<number>(0);
  const [plyniumAgentName, setPlyniumAgentName] = useState<string>("");

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
  const totalPreTax = totalBeforeDiscount * (1 - form.general_discount_pct / 100);
  const isSpain = (selectedCustomer?.country ?? "").toLowerCase() === "spain";
  const vatPct = isSpain ? 21 : 0;
  const totalAfterTax = totalPreTax * (1 + vatPct / 100);
  const paymentsSum = form.payments.reduce((s, p) => s + p.amount, 0);
  const paymentsMatchTotal = form.payments.length > 0 && Math.abs(paymentsSum - totalAfterTax) < 0.01;
  const canAdvanceStep3 = form.isExchange || paymentsMatchTotal;

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

      <div className="bg-white rounded-b-lg overflow-hidden p-12 w-full">
        {/* Step 1: Account + contact */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">1) Account selection</p>
              <div className="space-y-2">
                <label className="block text-xs text-gray-600 mb-1">Account (customer)</label>
                <button
                  type="button"
                  onClick={() => setCustomerModalOpen(true)}
                  className={`w-full px-4 py-2 border-2 rounded-lg text-sm font-medium transition-colors ${
                    form.id_customer
                      ? "border-blue-800 bg-blue-800 text-white hover:bg-blue-900 hover:border-blue-900"
                      : "border-dashed border-gray-300 text-gray-700 hover:border-blue-950 hover:bg-blue-50/30"
                  }`}
                >
                  {form.id_customer ? (selectedCustomer?.name ?? form.id_customer) : "Select account"}
                </button>
                <p className="text-xs text-gray-500">
                  Account doesn&apos;t exist?{" "}
                  <Link href="/logged/pages/account-management/customers_db/create" className="text-blue-600 hover:underline">
                    Create account
                  </Link>
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">1.2) Main contact for the proposal</p>
              <div className="space-y-2">
                <label className="block text-xs text-gray-600 mb-1">Contact</label>
                <button
                  type="button"
                  onClick={() => form.id_customer && setContactModalOpen(true)}
                  disabled={!form.id_customer}
                  className={`w-full px-4 py-2 border-2 rounded-lg text-sm font-medium transition-colors ${
                    !form.id_customer
                      ? "border-dashed border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                      : form.id_contact
                        ? "border-blue-800 bg-blue-800 text-white hover:bg-blue-900 hover:border-blue-900"
                        : "border-dashed border-gray-300 text-gray-700 hover:border-blue-950 hover:bg-blue-50/30"
                  }`}
                >
                  {form.id_contact ? (selectedContact?.name ?? form.id_contact) : "Select contact"}
                </button>
                <p className="text-xs text-gray-500">
                  Contact doesn&apos;t exist?{" "}
                  <Link href="/logged/pages/account-management/contacts_db/create" className="text-blue-600 hover:underline">
                    Create contact
                  </Link>
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => form.id_customer && setAdditionalContactModalOpen(true)}
                  disabled={!form.id_customer}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add additional contacts
                </button>
                {form.additionalContactIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.additionalContactIds.map((id) => {
                      const c = contacts.find((x) => x.id_contact === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-sm text-gray-800"
                        >
                          {c?.name ?? id}
                          <button
                            type="button"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                additionalContactIds: f.additionalContactIds.filter((x) => x !== id),
                              }))
                            }
                            className="p-0.5 rounded-full hover:bg-gray-300 text-gray-500 hover:text-gray-700 focus:outline-none"
                            aria-label="Remove contact"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Proposal title <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Glass facade installation"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Creation date</label>
              <input
                type="date"
                value={form.proposal_date}
                onChange={(e) => setForm((f) => ({ ...f, proposal_date: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Estimated expiration date</label>
              <input
                type="date"
                value={form.expiration_date}
                onChange={(e) => setForm((f) => ({ ...f, expiration_date: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-0.5">Default: 2 months from creation. Validity of the proposal.</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={goNext}
                disabled={!canAdvanceStep1}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Products
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Table + proposal data + totals */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Proposal data */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm font-semibold text-gray-700 mb-4">Proposal data</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Company name</span>
                  <p className="font-medium text-gray-900">{selectedCustomer?.name ?? "—"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Company country</span>
                  <p className="font-medium text-gray-900">{selectedCustomer?.country ?? "—"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Proposal title</span>
                  <p className="font-medium text-gray-900">{form.title || "—"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Proposal date</span>
                  <p className="font-medium text-gray-900">{form.proposal_date || "—"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Expiration date</span>
                  <p className="font-medium text-gray-900">{form.expiration_date || "—"}</p>
                </div>
              </div>
            </div>

            {/* Table with insert-between rows */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Service</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Description</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Specifications</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">units</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">discount</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {form.serviceLines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setInsertAtIndex(0);
                            setServiceModalOpen(true);
                          }}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Add service here
                        </button>
                      </td>
                    </tr>
                  ) : (
                    form.serviceLines.map((line, index) => (
                      <React.Fragment key={line.lineId}>
                        {/* Hover zone above row: Add service here */}
                        <tr
                          className="insert-zone group"
                          role="presentation"
                        >
                          <td
                            colSpan={6}
                            className="p-0 h-4 align-middle cursor-pointer border-none bg-transparent hover:bg-blue-50/50"
                            onClick={() => {
                              setInsertAtIndex(index);
                              setServiceModalOpen(true);
                            }}
                          >
                            <span className="inline-flex items-center justify-center w-full opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-700 text-white px-2 py-0.5 rounded">
                              Add service here
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:border-gray-200">
                          <td className="px-3 py-2 align-top">
                            <span className="font-medium text-gray-900">{getServiceName(line.id_service)}</span>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input
                              type="text"
                              value={line.description}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  serviceLines: f.serviceLines.map((l) =>
                                    l.lineId === line.lineId ? { ...l, description: e.target.value } : l
                                  ),
                                }))
                              }
                              className="w-full min-w-[120px] px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Description"
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input
                              type="text"
                              value={line.specifications}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  serviceLines: f.serviceLines.map((l) =>
                                    l.lineId === line.lineId ? { ...l, specifications: e.target.value } : l
                                  ),
                                }))
                              }
                              className="w-full min-w-[120px] px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Specifications"
                            />
                          </td>
                          <td className="px-3 py-2 align-top text-right">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={line.units}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                setForm((f) => ({
                                  ...f,
                                  serviceLines: f.serviceLines.map((l) =>
                                    l.lineId === line.lineId ? { ...l, units: Number.isNaN(v) ? 0 : Math.max(0, v) } : l
                                  ),
                                }));
                              }}
                              className="w-16 px-2 py-1 text-sm border border-gray-200 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2 align-top text-right">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={line.discount_pct}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                setForm((f) => ({
                                  ...f,
                                  serviceLines: f.serviceLines.map((l) =>
                                    l.lineId === line.lineId ? { ...l, discount_pct: Number.isNaN(v) ? 0 : v } : l
                                  ),
                                }));
                              }}
                              className="w-14 px-2 py-1 text-sm border border-gray-200 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            %
                          </td>
                          <td className="px-3 py-2 align-top text-right">
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={line.price}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                setForm((f) => ({
                                  ...f,
                                  serviceLines: f.serviceLines.map((l) =>
                                    l.lineId === line.lineId ? { ...l, price: Number.isNaN(v) ? 0 : v } : l
                                  ),
                                }));
                              }}
                              className="w-20 px-2 py-1 text-sm border border-gray-200 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            €
                          </td>
                        </tr>
                        {/* Hover zone below row: Add service here */}
                        <tr
                          className="insert-zone group"
                          role="presentation"
                        >
                          <td
                            colSpan={6}
                            className="p-0 h-4 align-middle cursor-pointer border-none bg-transparent hover:bg-blue-50/50"
                            onClick={() => {
                              setInsertAtIndex(index + 1);
                              setServiceModalOpen(true);
                            }}
                          >
                            <span className="inline-flex items-center justify-center w-full opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-700 text-white px-2 py-0.5 rounded">
                              Add service here
                            </span>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
              {form.serviceLines.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setInsertAtIndex(form.serviceLines.length);
                      setServiceModalOpen(true);
                    }}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Add service here
                  </button>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-sm ml-auto">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total before discount</span>
                  <span className="font-medium">{totalBeforeDiscount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">General discount</span>
                  <span className="font-medium">{form.general_discount_pct}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total pre-tax</span>
                  <span className="font-medium">{totalPreTax.toFixed(2)} €</span>
                </div>
                {vatPct > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">VAT ({vatPct}%)</span>
                    <span className="font-medium">{(totalAfterTax - totalPreTax).toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200 text-base font-semibold">
                  <span>Total after tax</span>
                  <span>{totalAfterTax.toFixed(2)} €</span>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs text-gray-600 mb-1">General discount (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={form.general_discount_pct}
                  onChange={(e) => setForm((f) => ({ ...f, general_discount_pct: Number(e.target.value) || 0 }))}
                  className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={goBack} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
                Back
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!canAdvanceStep2}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Payment
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Total amount */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm font-semibold text-gray-700 mb-1">Total amount</p>
              <p className="text-2xl font-bold text-gray-900">{totalAfterTax.toFixed(2)} €</p>
            </div>

            {/* Exchange: is this an exchange? */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm font-semibold text-gray-700 mb-1">Exchange</p>
              <p className="text-xs text-gray-500 mb-3">Is this an exchange?</p>
              <button
                type="button"
                role="switch"
                aria-checked={form.isExchange}
                onClick={() => {
                  setForm((f) => ({
                    ...f,
                    isExchange: !f.isExchange,
                    ...(!f.isExchange && { exchangeFinalPrice: totalAfterTax }),
                  }));
                }}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  form.isExchange ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                    form.isExchange ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="ml-2 text-sm text-gray-700">{form.isExchange ? "Yes" : "No"}</span>
            </div>

            {!form.isExchange ? (
              /* Payments section */
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <p className="text-sm font-semibold text-gray-700">Payments</p>
                  <button
                    type="button"
                    onClick={() => {
                      const sumSoFar = form.payments.reduce((s, p) => s + p.amount, 0);
                      const suggestedAmount = Math.round((totalAfterTax - sumSoFar) * 100) / 100;
                      setForm((f) => {
                        const prevPayments = f.payments;
                        const initialDate =
                          prevPayments.length === 0
                            ? (() => {
                                const n = new Date();
                                const nextMonth = new Date(n.getFullYear(), n.getMonth() + 1, 15);
                                return nextMonth.toISOString().slice(0, 10);
                              })()
                            : (() => {
                                const lastDate = prevPayments[prevPayments.length - 1].date;
                                const d = new Date(lastDate);
                                const oneMonthLater = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
                                return oneMonthLater.toISOString().slice(0, 10);
                              })();
                        return {
                          ...f,
                          payments: [
                            ...prevPayments,
                            {
                              paymentId: `pay-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                              date: initialDate,
                              paymentMethod: "transferencia_bancaria" as const,
                              bank: "Sabadell" as const,
                              amount: suggestedAmount,
                            },
                          ],
                        };
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Add payment
                  </button>
                </div>

                <div className="space-y-4">
                  {form.payments.map((payment) => (
                    <div
                      key={payment.paymentId}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50/50"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Date</label>
                          <input
                            type="date"
                            value={payment.date}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                payments: f.payments.map((p) =>
                                  p.paymentId === payment.paymentId ? { ...p, date: e.target.value } : p
                                ),
                              }))
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Payment method</label>
                          <select
                            value={payment.paymentMethod}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                payments: f.payments.map((p) =>
                                  p.paymentId === payment.paymentId
                                    ? { ...p, paymentMethod: e.target.value as "recibo" | "transferencia_bancaria" }
                                    : p
                                ),
                              }))
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="recibo">Direct debit</option>
                            <option value="transferencia_bancaria">Bank transfer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Payment bank</label>
                          <select
                            value={payment.bank}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                payments: f.payments.map((p) =>
                                  p.paymentId === payment.paymentId
                                    ? { ...p, bank: e.target.value as "Sabadell" | "Santander" }
                                    : p
                                ),
                              }))
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Sabadell">Sabadell</option>
                            <option value="Santander">Santander</option>
                          </select>
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">Amount (€)</label>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={payment.amount}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                setForm((f) => ({
                                  ...f,
                                  payments: f.payments.map((p) =>
                                    p.paymentId === payment.paymentId
                                      ? { ...p, amount: Number.isNaN(v) ? 0 : v }
                                      : p
                                  ),
                                }));
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0.00"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                payments: f.payments.filter((p) => p.paymentId !== payment.paymentId),
                              }))
                            }
                            className="px-2 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Remove payment"
                            aria-label="Remove payment"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {form.payments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total payments:</span>
                    <span className={`font-medium ${paymentsMatchTotal ? "text-green-600" : "text-amber-600"}`}>
                      {paymentsSum.toFixed(2)} €
                      {!paymentsMatchTotal && (
                        <span className="ml-2">
                          (must match {totalAfterTax.toFixed(2)} €)
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Exchange terms */
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <p className="text-sm font-semibold text-gray-700 mb-4">Exchange terms</p>

                <div className="space-y-6">
                  {/* Is there a final exchange price? */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-gray-700">Is there a final exchange price?</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.exchangeHasFinalPrice}
                      onClick={() => {
                        setForm((f) => ({
                          ...f,
                          exchangeHasFinalPrice: !f.exchangeHasFinalPrice,
                          ...(!f.exchangeHasFinalPrice && { exchangeFinalPrice: totalAfterTax }),
                        }));
                      }}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        form.exchangeHasFinalPrice ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                          form.exchangeHasFinalPrice ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-sm text-gray-600">{form.exchangeHasFinalPrice ? "Yes" : "No"}</span>
                  </div>

                  {/* Shall there be an exchange of bank transfers? (only when there is a final exchange price) */}
                  {form.exchangeHasFinalPrice && (
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-gray-700">Shall there be an exchange of bank transfers?</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={form.exchangeHasBankTransfers}
                        onClick={() => setForm((f) => ({ ...f, exchangeHasBankTransfers: !f.exchangeHasBankTransfers }))}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          form.exchangeHasBankTransfers ? "bg-blue-600" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                            form.exchangeHasBankTransfers ? "translate-x-5" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className="text-sm text-gray-600">{form.exchangeHasBankTransfers ? "Yes" : "No"}</span>
                    </div>
                    {form.exchangeHasBankTransfers && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 pl-0">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Plynium transfer date</label>
                          <input
                            type="date"
                            value={form.exchangePlyniumTransferDate}
                            onChange={(e) => setForm((f) => ({ ...f, exchangePlyniumTransferDate: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Counterpart exchange date</label>
                          <input
                            type="date"
                            value={form.exchangeCounterpartDate}
                            onChange={(e) => setForm((f) => ({ ...f, exchangeCounterpartDate: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Transferred amount (€)</label>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={form.exchangeTransferredAmount || ""}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setForm((f) => ({ ...f, exchangeTransferredAmount: Number.isNaN(v) ? 0 : v }));
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  )}

                  {/* To be received in exchange for our advertisement - Rich text */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">To be received in exchange for our advertisement</label>
                    <RichTextEditor
                      value={form.exchangeToBeReceivedHtml}
                      onChange={(html) => setForm((f) => ({ ...f, exchangeToBeReceivedHtml: html }))}
                      placeholder="To be received in exchange for our advertisement"
                      minHeight="120px"
                      className="min-w-0"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={goBack} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
                Back
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!canAdvanceStep3}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Review
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm font-semibold text-gray-700 mb-4">4) Proposal review</p>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500">Account</dt>
                  <dd className="font-medium">{(selectedCustomer?.name ?? form.id_customer) || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Contact</dt>
                  <dd className="font-medium">{(selectedContact?.name ?? form.id_contact) || "—"} {selectedContact?.email ? `(${selectedContact.email})` : ""}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Title</dt>
                  <dd className="font-medium">{form.title || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Plynium agent</dt>
                  <dd className="font-medium">{plyniumAgentName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Creation date</dt>
                  <dd className="font-medium">{form.proposal_date || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Estimated expiration date</dt>
                  <dd className="font-medium">{form.expiration_date || "—"}</dd>
                </div>
              </dl>
              <table className="mt-4 w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Service</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Description</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Units</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Price</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Disc. %</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {form.serviceLines.map((line) => {
                    const lineTotal = line.units * line.price * (1 - line.discount_pct / 100);
                    return (
                      <tr key={line.lineId}>
                        <td className="px-4 py-2">{getServiceName(line.id_service)}</td>
                        <td className="px-4 py-2">{line.description || "—"}</td>
                        <td className="px-4 py-2 text-right">{line.units}</td>
                        <td className="px-4 py-2 text-right">{line.price} €</td>
                        <td className="px-4 py-2 text-right">{line.discount_pct}%</td>
                        <td className="px-4 py-2 text-right">{lineTotal.toFixed(2)} €</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-1 text-sm text-right">
                <div>Total before discount: <strong>{totalBeforeDiscount.toFixed(2)} €</strong></div>
                <div>General discount {form.general_discount_pct}%: <strong>{totalPreTax.toFixed(2)} €</strong> (pre-tax)</div>
                {vatPct > 0 && <div>VAT {vatPct}%: <strong>{(totalAfterTax - totalPreTax).toFixed(2)} €</strong></div>}
                <p className="mt-2 text-lg font-semibold">Total after tax: {totalAfterTax.toFixed(2)} €</p>
              </div>

              {form.payments.length > 0 && !form.isExchange && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Payment method</p>
                  <ul className="space-y-2 text-sm">
                    {form.payments.map((p) => (
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
              {form.isExchange && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Exchange terms</p>
                  {form.exchangeHasBankTransfers && (
                    <div className="text-sm text-gray-600 mt-2 space-y-1">
                      <p>Plynium transfer date: {form.exchangePlyniumTransferDate || "—"}</p>
                      <p>Counterpart exchange date: {form.exchangeCounterpartDate || "—"}</p>
                      <p>Transferred amount: {form.exchangeTransferredAmount != null ? `${form.exchangeTransferredAmount.toFixed(2)} €` : "—"}</p>
                    </div>
                  )}
                  {form.exchangeToBeReceivedHtml && (
                    <div className="mt-3 text-sm">
                      <p className="text-gray-600 mb-1">To be received in exchange for our advertisement:</p>
                      <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: form.exchangeToBeReceivedHtml }} />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={goBack} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
                Back
              </button>
              <button
                type="button"
                onClick={() => router.push(backUrl)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Create proposal
              </button>
            </div>
          </div>
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
          const price = service.tariff_price_eur;
          const newLine: ServiceLine = {
            lineId: `line-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            id_service: service.id_service,
            description: service.description ?? "",
            specifications: "",
            units: 1,
            discount_pct: 0,
            price,
            ...(extra && "publicationMonth" in extra && { publicationMonth: extra.publicationMonth, publicationYear: extra.publicationYear }),
            ...(extra && "startDate" in extra && { startDate: extra.startDate, endDate: extra.endDate }),
            ...(extra && "id_planned_publication" in extra && {
              id_planned_publication: extra.id_planned_publication,
              ...("pageType" in extra && { magazinePageType: extra.pageType, magazineSlotKey: extra.slotKey }),
            }),
          };
          if (extra && "calculatedPrice" in extra) (newLine as ServiceLine).price = extra.calculatedPrice;
          setForm((f) => ({
            ...f,
            serviceLines: [
              ...f.serviceLines.slice(0, insertAtIndex),
              newLine,
              ...f.serviceLines.slice(insertAtIndex),
            ],
          }));
          setServiceModalOpen(false);
        }}
      />
    </>
  );
};

export default CreateProposalPage;
