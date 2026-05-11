"use client";

import React, { FC } from "react";
import type { ServiceGroupListRow } from "./types";
import { formatStandardTariffEUR } from "./serviceGroupsListUtils";

export type ServiceGroupsTableProps = {
    rows: ServiceGroupListRow[];
    rowClassName: string;
    onRowNavigate: (serviceGroupId: string) => void;
};

export const ServiceGroupsTable: FC<ServiceGroupsTableProps> = ({ rows, rowClassName, onRowNavigate }) => (
    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
            <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Standard tariff price (€)
                </th>
            </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((g) => (
                <tr
                    key={g.service_group_id}
                    onClick={() => onRowNavigate(g.service_group_id)}
                    className={rowClassName}
                >
                    <td className="px-6 py-4 text-sm text-gray-900">{g.service_group_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {g.service_group_channel || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right tabular-nums">
                        {formatStandardTariffEUR(g.tariff_price_eur)}
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);
