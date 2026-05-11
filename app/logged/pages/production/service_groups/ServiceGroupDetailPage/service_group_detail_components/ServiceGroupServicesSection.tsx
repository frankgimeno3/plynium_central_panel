"use client";

import React, { FC } from "react";
import type { ServiceGroupServiceRow } from "./types";

export type ServiceGroupServicesSectionProps = {
    services: ServiceGroupServiceRow[];
};

export const ServiceGroupServicesSection: FC<ServiceGroupServicesSectionProps> = ({ services }) => (
    <div className="bg-white rounded-b-lg overflow-hidden border border-gray-200">
        <div className="p-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">
                Services in this group ({services.length})
            </p>
            {services.length === 0 ? (
                <p className="text-sm text-gray-500">No services linked to this group.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Service ID
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Name
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Tariff (€)
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {services.map((s) => (
                                <tr key={s.id_service}>
                                    <td className="px-4 py-2 text-sm font-mono text-gray-900">{s.id_service}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">{s.name}</td>
                                    <td className="px-4 py-2 text-sm text-gray-700">
                                        {(s.tariff_price_eur ?? 0).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </div>
);
