"use client";

import React, { FC } from "react";
import { RichTextEditor } from "@/app/logged/logged_components/RichTextEditor";
import type { PaymentLine, ProposalForm } from "./types";

type Props = {
  form: ProposalForm;
  setForm: React.Dispatch<React.SetStateAction<ProposalForm>>;
  totalAfterTax: number;
  paymentsSum: number;
  paymentsMatchTotal: boolean;
  onBack: () => void;
  onNext: () => void;
  canAdvance: boolean;
};

const Step3Payment: FC<Props> = ({
  form,
  setForm,
  totalAfterTax,
  paymentsSum,
  paymentsMatchTotal,
  onBack,
  onNext,
  canAdvance,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-sm font-semibold text-gray-700 mb-1">Total amount</p>
        <p className="text-2xl font-bold text-gray-900">{totalAfterTax.toFixed(2)} €</p>
      </div>

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
                  const newPayment: PaymentLine = {
                    paymentId: `pay-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    date: initialDate,
                    paymentMethod: "transferencia_bancaria",
                    bank: "Sabadell",
                    amount: suggestedAmount,
                  };
                  return { ...f, payments: [...prevPayments, newPayment] };
                });
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Add payment
            </button>
          </div>

          <div className="space-y-4">
            {form.payments.map((payment) => (
              <div key={payment.paymentId} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Date</label>
                    <input
                      type="date"
                      value={payment.date}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          payments: f.payments.map((p) => (p.paymentId === payment.paymentId ? { ...p, date: e.target.value } : p)),
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
                            p.paymentId === payment.paymentId ? { ...p, bank: e.target.value as "Sabadell" | "Santander" } : p
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
                              p.paymentId === payment.paymentId ? { ...p, amount: Number.isNaN(v) ? 0 : v } : p
                            ),
                          }));
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, payments: f.payments.filter((p) => p.paymentId !== payment.paymentId) }))}
                      className="px-2 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Remove payment"
                      aria-label="Remove payment"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
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
                {!paymentsMatchTotal && <span className="ml-2">(must match {totalAfterTax.toFixed(2)} €)</span>}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm font-semibold text-gray-700 mb-4">Exchange terms</p>

          <div className="space-y-6">
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
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canAdvance}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Review
        </button>
      </div>
    </div>
  );
};

export default Step3Payment;

