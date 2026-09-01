"use client";

import React, { FC, useMemo } from "react";
import type { ServiceLineDraft } from "./types";

export type { ServiceLineDraft };

type Props = {
  draft: ServiceLineDraft;
  onChange: (patch: Partial<ServiceLineDraft>) => void;
};

export function computeLineFinalPrice(units: number, unitPrice: number, discountPct: number): number {
  const u = Math.max(0, Number(units) || 0);
  const p = Math.max(0, Number(unitPrice) || 0);
  const d = Math.max(0, Math.min(100, Number(discountPct) || 0));
  return Math.round(u * p * (1 - d / 100) * 100) / 100;
}

export const ServiceLineConfirmFields: FC<Props> = ({ draft, onChange }) => {
  const finalPrice = useMemo(
    () => computeLineFinalPrice(draft.units, draft.unit_price, draft.discount_pct),
    [draft.units, draft.unit_price, draft.discount_pct]
  );

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Line details</p>

      <div>
        <label className="mb-1 block text-xs text-gray-600">Description</label>
        <textarea
          rows={3}
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="Description"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-600">Specifications</label>
        <textarea
          rows={2}
          value={draft.specifications}
          onChange={(e) => onChange({ specifications: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="Specifications"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs text-gray-600">Units</label>
          <input
            type="number"
            min={0}
            step={1}
            value={draft.units}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChange({ units: Number.isNaN(v) ? 0 : Math.max(0, v) });
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-right"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-600">Unit price (€)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={draft.unit_price}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChange({ unit_price: Number.isNaN(v) ? 0 : Math.max(0, v) });
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-right"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-600">Unit discount (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={draft.discount_pct}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChange({ discount_pct: Number.isNaN(v) ? 0 : v });
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-right"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-600">Final price (€)</label>
          <div className="flex h-[42px] items-center justify-end rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-900">
            {finalPrice.toFixed(2)} €
          </div>
        </div>
      </div>
    </div>
  );
};
