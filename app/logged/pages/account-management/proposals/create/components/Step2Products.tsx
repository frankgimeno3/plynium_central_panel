"use client";

import React, { FC } from "react";
import type { ProposalForm, Service, ServiceLine, ServiceLinePriceMode } from "./types";
import {
  applyServiceLinePatch,
  getDisplayServiceTotal,
  setServiceLinePriceMode,
} from "../serviceLinePricing";

const PRICE_MODE_OPTIONS: { mode: ServiceLinePriceMode; label: string }[] = [
  { mode: "calculated", label: "Calculated price" },
  { mode: "strikethrough", label: "Strikethrough" },
  { mode: "free", label: "Free" },
  { mode: "custom", label: "Custom price" },
];

const COL_COUNT = 9;

type Props = {
  form: ProposalForm;
  setForm: React.Dispatch<React.SetStateAction<ProposalForm>>;
  services: Service[];
  selectedCustomer?: { name?: string; country?: string };
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

function ServiceTotalPriceCell({ line }: { line: ServiceLine }) {
  const total = getDisplayServiceTotal(line);
  const mode = line.price_mode ?? "calculated";

  if (mode === "free") {
    return <span className="text-sm font-semibold text-emerald-700">FREE</span>;
  }

  if (mode === "custom") {
    return null;
  }

  if (mode === "strikethrough") {
    return (
      <span className="text-sm text-gray-600 line-through tabular-nums">
        {total.toFixed(2)} €
      </span>
    );
  }

  return <span className="text-sm text-gray-700 tabular-nums">{total.toFixed(2)} €</span>;
}

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
  const updateLine = (lineId: string, patch: Partial<ServiceLine>) => {
    setForm((f) => ({
      ...f,
      serviceLines: f.serviceLines.map((l) => (l.lineId === lineId ? applyServiceLinePatch(l, patch) : l)),
    }));
  };

  const changePriceMode = (lineId: string, mode: ServiceLinePriceMode) => {
    setForm((f) => ({
      ...f,
      serviceLines: f.serviceLines.map((l) => (l.lineId === lineId ? setServiceLinePriceMode(l, mode) : l)),
    }));
  };

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

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm text-gray-600">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-center font-medium text-gray-600 w-10" aria-label="Remove" />
              <th className="px-3 py-2 text-center font-medium text-gray-600">Service</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600">Description</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600">Specifications</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600">Units</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600">Unit price</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600">Discount</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600">Service total price</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600 min-w-[140px]">Actions</th>
              </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {form.serviceLines.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT} className="px-3 py-6 text-center">
                  <button
                    type="button"
                    onClick={() => onOpenServiceModalAt(0)}
                    className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-blue-50 text-blue-950 border border-blue-200 hover:bg-blue-100 font-semibold"
                  >
                    Add service here
                  </button>
                </td>
              </tr>
            ) : (
              form.serviceLines.map((line, index) => {
                const priceMode = line.price_mode ?? "calculated";
                const isCustomPrice = priceMode === "custom";
                const showDiscountInput = priceMode === "calculated";

                return (
                  <React.Fragment key={line.lineId}>
                    <tr className="insert-zone group" role="presentation">
                      <td
                        colSpan={COL_COUNT}
                        className="px-3 py-2 align-middle cursor-pointer border-none bg-blue-50/70 hover:bg-blue-100/80"
                        onClick={() => onOpenServiceModalAt(index)}
                      >
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-950 text-sm font-semibold hover:bg-blue-100"
                          >
                            + Add service here
                          </button>
                        </div>
                      </td>
                    </tr>

                    <tr className="border-b border-gray-100 hover:border-gray-200">
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                serviceLines: f.serviceLines.filter((l) => l.lineId !== line.lineId),
                              }))
                            }
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-red-600 text-white hover:bg-red-700 border border-red-600 shrink-0"
                            aria-label={`Remove ${getServiceName(line.id_service)}`}
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center">
                          <div className="bg-gray-100 rounded-lg p-3 w-full max-w-full">
                            <span className="font-semibold text-gray-600 block text-center">
                              {getServiceName(line.id_service)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center">
                          <div className="bg-gray-100 rounded-lg p-3 w-full">
                            <input
                              type="text"
                              value={line.description}
                              onChange={(e) => updateLine(line.lineId, { description: e.target.value })}
                              className="w-full min-w-[120px] px-2 py-1 text-sm text-gray-600 placeholder:text-gray-500 bg-white border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Description"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center">
                          <div className="bg-gray-100 rounded-lg p-3 w-full">
                            <input
                              type="text"
                              value={line.specifications}
                              onChange={(e) => updateLine(line.lineId, { specifications: e.target.value })}
                              className="w-full min-w-[120px] px-2 py-1 text-sm text-gray-600 placeholder:text-gray-500 bg-white border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Specifications"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center">
                          <div className="bg-gray-100 rounded-lg p-3">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={line.units}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                updateLine(line.lineId, { units: Number.isNaN(v) ? 0 : Math.max(0, v) });
                              }}
                              className="w-16 px-2 py-1 text-sm text-gray-600 bg-white border border-gray-600 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center">
                          <div className="bg-gray-100 rounded-lg p-3">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={line.unit_price ?? line.price ?? 0}
                                onChange={(e) => {
                                  const v = Number(e.target.value);
                                  updateLine(line.lineId, { unit_price: Number.isNaN(v) ? 0 : Math.max(0, v) });
                                }}
                                className="w-20 px-2 py-1 text-sm text-gray-600 bg-white border border-gray-600 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <span className="text-gray-600">€</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center">
                          <div
                            className={`bg-gray-100 rounded-lg p-3 ${showDiscountInput ? "" : "invisible pointer-events-none"}`}
                            aria-hidden={!showDiscountInput}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step={0.5}
                                value={line.discount_pct}
                                tabIndex={showDiscountInput ? 0 : -1}
                                onChange={(e) => {
                                  const v = Number(e.target.value);
                                  updateLine(line.lineId, { discount_pct: Number.isNaN(v) ? 0 : v });
                                }}
                                className="w-14 px-2 py-1 text-sm text-gray-600 bg-white border border-gray-600 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <span className="text-gray-600">%</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center">
                          <div className="bg-gray-100 rounded-lg p-3 min-w-[7rem]">
                            {isCustomPrice ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={line.service_total_price}
                                  onChange={(e) => {
                                    const v = Number(e.target.value);
                                    updateLine(line.lineId, {
                                      service_total_price: Number.isNaN(v) ? 0 : Math.max(0, v),
                                    });
                                  }}
                                  className="w-20 px-2 py-1 text-sm text-gray-600 bg-white border border-gray-600 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <span className="text-gray-600">€</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center min-h-[30px]">
                                <ServiceTotalPriceCell line={line} />
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center">
                          <div className="bg-gray-100 rounded-lg p-2 space-y-1.5">
                            {PRICE_MODE_OPTIONS.map(({ mode, label }) => (
                              <label
                                key={mode}
                                className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name={`price-mode-${line.lineId}`}
                                  checked={priceMode === mode}
                                  onChange={() => changePriceMode(line.lineId, mode)}
                                  className="rounded-full border-gray-400 text-blue-600 focus:ring-blue-500"
                                />
                                <span>{label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>

                    <tr className="insert-zone group" role="presentation">
                      <td
                        colSpan={COL_COUNT}
                        className="px-3 py-2 align-middle cursor-pointer border-none bg-blue-50/70 hover:bg-blue-100/80"
                        onClick={() => onOpenServiceModalAt(index + 1)}
                      >
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-950 text-sm font-semibold hover:bg-blue-100"
                          >
                            + Add service here
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
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
              {form.general_discount_mode === "abs"
                ? `${(Number(form.general_discount_abs_eur) || 0).toFixed(2)} €`
                : `${form.general_discount_pct}%`}
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
            <label className="block text-xs text-gray-600">General discount</label>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-semibold tabular-nums ${
                  form.general_discount_mode === "pct" ? "text-blue-800" : "text-gray-400"
                }`}
              >
                %
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={form.general_discount_mode === "abs"}
                aria-label={
                  form.general_discount_mode === "abs"
                    ? "General discount in euros"
                    : "General discount in percent"
                }
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    general_discount_mode: f.general_discount_mode === "pct" ? "abs" : "pct",
                  }))
                }
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  form.general_discount_mode === "abs" ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                    form.general_discount_mode === "abs" ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  form.general_discount_mode === "abs" ? "text-blue-800" : "text-gray-400"
                }`}
              >
                €
              </span>
            </div>
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
