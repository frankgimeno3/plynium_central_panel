"use client";

import React, { FC } from "react";
import type { Customer, ProposalForm, Service, ServiceLine } from "./types";

type Props = {
  form: ProposalForm;
  setForm: React.Dispatch<React.SetStateAction<ProposalForm>>;
  services: Service[];
  selectedCustomer?: Customer;
  getServiceName: (id_service: string) => string;
  totalBeforeDiscount: number;
  totalPreTax: number;
  totalAfterTax: number;
  vatPct: number;
  onBack: () => void;
  onNext: () => void;
  canAdvance: boolean;
  onOpenServiceModalAt: (index: number) => void;
};

const Step2Products: FC<Props> = ({
  form,
  setForm,
  selectedCustomer,
  getServiceName,
  totalBeforeDiscount,
  totalPreTax,
  totalAfterTax,
  vatPct,
  onBack,
  onNext,
  canAdvance,
  onOpenServiceModalAt,
}) => {
  return (
    <div className="space-y-6">
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

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-gray-200">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-200">Service</th>
              <th className="px-3 py-2 text-left font-medium text-gray-200">Description</th>
              <th className="px-3 py-2 text-left font-medium text-gray-200">Specifications</th>
              <th className="px-3 py-2 text-right font-medium text-gray-200">units</th>
              <th className="px-3 py-2 text-right font-medium text-gray-200">discount</th>
              <th className="px-3 py-2 text-right font-medium text-gray-200">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {form.serviceLines.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => onOpenServiceModalAt(0)}
                    className="inline-flex items-center justify-center w-full max-w-sm px-4 py-3 rounded-lg bg-blue-50 text-gray-200 border border-blue-100 hover:bg-blue-100 font-semibold"
                  >
                    Add service here
                  </button>
                </td>
              </tr>
            ) : (
              form.serviceLines.map((line, index) => (
                <React.Fragment key={line.lineId}>
                  <tr className="insert-zone group" role="presentation">
                    <td
                      colSpan={6}
                      className="px-3 py-2 align-middle cursor-pointer border-none bg-blue-50/70 hover:bg-blue-100/80"
                      onClick={() => onOpenServiceModalAt(index)}
                    >
                      <div className="flex items-center justify-center">
                        <span className="inline-flex items-center justify-center w-full max-w-sm text-sm font-semibold text-gray-200">
                          + Add service here
                        </span>
                      </div>
                    </td>
                  </tr>

                  <tr className="border-b border-gray-100 hover:border-gray-200">
                    <td className="px-3 py-2 align-top">
                      <span className="font-medium text-gray-200">{getServiceName(line.id_service)}</span>
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
                        className="w-full min-w-[120px] px-2 py-1 text-sm text-gray-200 placeholder:text-gray-300 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Description"
                      />
                    </td>
                    <td className="px-3 py-2 align-top text-gray-200">
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
                        className="w-full min-w-[120px] px-2 py-1 text-sm text-gray-200 placeholder:text-gray-300 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Specifications"
                      />
                    </td>
                    <td className="px-3 py-2 align-top text-right text-gray-200">
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
                        className="w-16 px-2 py-1 text-sm text-gray-200 border border-gray-200 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                        className="w-14 px-2 py-1 text-sm text-gray-200 border border-gray-200 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                        className="w-20 px-2 py-1 text-sm text-gray-200 border border-gray-200 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      €
                    </td>
                  </tr>

                  <tr className="insert-zone group" role="presentation">
                    <td
                      colSpan={6}
                      className="px-3 py-2 align-middle cursor-pointer border-none bg-blue-50/70 hover:bg-blue-100/80"
                      onClick={() => onOpenServiceModalAt(index + 1)}
                    >
                      <div className="flex items-center justify-center">
                        <span className="inline-flex items-center justify-center w-full max-w-sm text-sm font-semibold text-gray-200">
                          + Add service here
                        </span>
                      </div>
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
              onClick={() => onOpenServiceModalAt(form.serviceLines.length)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-gray-200 font-semibold hover:bg-blue-700"
            >
              + Add service here
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-sm ml-auto">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total before discount</span>
            <span className="font-medium">{totalBeforeDiscount.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">General discount</span>
            <span className="font-medium">
              {form.general_discount_mode === "abs" ? `${(Number(form.general_discount_abs_eur) || 0).toFixed(2)} €` : `${form.general_discount_pct}%`}
            </span>
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
          <div className="flex items-center justify-between gap-3">
            <label className="block text-xs text-gray-600">
              General discount ({form.general_discount_mode === "abs" ? "€" : "%"})
            </label>
            <button
              type="button"
              role="switch"
              aria-checked={form.general_discount_mode === "abs"}
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  general_discount_mode: f.general_discount_mode === "pct" ? "abs" : "pct",
                }))
              }
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                form.general_discount_mode === "abs" ? "bg-blue-600" : "bg-gray-200"
              }`}
              title={form.general_discount_mode === "abs" ? "Absolute (€)" : "Percentage (%)"}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                  form.general_discount_mode === "abs" ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {form.general_discount_mode === "abs" ? (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.general_discount_abs_eur}
                onChange={(e) => setForm((f) => ({ ...f, general_discount_abs_eur: Number(e.target.value) || 0 }))}
                className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">€</span>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={form.general_discount_pct}
                onChange={(e) => setForm((f) => ({ ...f, general_discount_pct: Number(e.target.value) || 0 }))}
                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          )}
        </div>
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
          onClick={onNext}
          disabled={!canAdvance}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Payment
        </button>
      </div>
    </div>
  );
};

export default Step2Products;

