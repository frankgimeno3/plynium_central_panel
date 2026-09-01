"use client";

import React, { FC } from "react";
import type { ServiceListRow } from "./constants";
import { specifityLabel } from "./constants";

type ServicesListTableProps = {
  rows: ServiceListRow[];
  serviceTypeLabel: (serviceType?: string) => string;
  onRowClick: (id: string) => void;
};

export const ServicesListTable: FC<ServicesListTableProps> = ({
  rows,
  serviceTypeLabel,
  onRowClick,
}) => {
  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Specifity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Service type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tariff (€)</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Publication date
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((s) => (
            <tr
              key={s.id_service}
              onClick={() => onRowClick(s.id_service)}
              className={rowClass}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.id_service}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{s.name?.replace(/_/g, " ")}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{specifityLabel(s.specifity)}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{serviceTypeLabel(s.service_type)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {s.tariff_price_eur?.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.publication_date ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
