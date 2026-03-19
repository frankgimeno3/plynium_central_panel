"use client";

import React, { FC } from "react";
import type { Contact, Customer, ProposalForm } from "./types";

type Props = {
  form: ProposalForm;
  customers: Customer[];
  contacts: Contact[];
  plyniumAgentName: string;
  getServiceName: (id_service: string) => string;
  totalBeforeDiscount: number;
  totalPreTax: number;
  totalAfterTax: number;
  vatPct: number;
  paymentsSum: number;
  paymentsMatchTotal: boolean;
  onBack: () => void;
  onCreate: () => void;
};

const Step4Review: FC<Props> = ({
  form,
  customers,
  contacts,
  plyniumAgentName,
  getServiceName,
  totalBeforeDiscount,
  totalPreTax,
  totalAfterTax,
  vatPct,
  paymentsSum,
  paymentsMatchTotal,
  onBack,
  onCreate,
}) => {
  const selectedCustomer = customers.find((c) => c.id_customer === form.id_customer);
  const selectedContact = contacts.find((c) => c.id_contact === form.id_contact);

  return (
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
            <dd className="font-medium">
              {(selectedContact?.name ?? form.id_contact) || "—"} {selectedContact?.email ? `(${selectedContact.email})` : ""}
            </dd>
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
          <div>
            Total before discount: <strong>{totalBeforeDiscount.toFixed(2)} €</strong>
          </div>
          <div>
            General discount{" "}
            {form.general_discount_mode === "abs"
              ? `${(Number(form.general_discount_abs_eur) || 0).toFixed(2)} €`
              : `${form.general_discount_pct}%`}
            : <strong>{totalPreTax.toFixed(2)} €</strong> (pre-tax)
          </div>
          {vatPct > 0 && (
            <div>
              VAT {vatPct}%: <strong>{(totalAfterTax - totalPreTax).toFixed(2)} €</strong>
            </div>
          )}
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
            <p className="text-sm text-gray-600 mt-2 text-right">
              Total payments:{" "}
              <strong className={paymentsMatchTotal ? "text-green-600" : "text-amber-600"}>{paymentsSum.toFixed(2)} €</strong>
            </p>
          </div>
        )}

        {form.isExchange && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">Exchange terms</p>
            {form.exchangeHasBankTransfers && (
              <div className="text-sm text-gray-600 mt-2 space-y-1">
                <p>Plynium transfer date: {form.exchangePlyniumTransferDate || "—"}</p>
                <p>Counterpart exchange date: {form.exchangeCounterpartDate || "—"}</p>
                <p>
                  Transferred amount:{" "}
                  {form.exchangeTransferredAmount != null ? `${form.exchangeTransferredAmount.toFixed(2)} €` : "—"}
                </p>
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
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Create proposal
        </button>
      </div>
    </div>
  );
};

export default Step4Review;

