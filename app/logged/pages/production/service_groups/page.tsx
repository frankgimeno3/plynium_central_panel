"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ServiceGroupService } from "@/app/service/ServiceGroupService";

type ServiceGroup = {
    service_group_id: string;
    service_group_name: string;
    service_group_channel: string;
    tariff_price_eur?: number;
};

function formatStandardTariffEUR(value: unknown): string {
    const n = Number(value ?? 0);
    const safe = Number.isFinite(n) ? n : 0;
    return `${safe.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

const CHANNEL_FILTER_OPTIONS: { value: string; label: string }[] = [
    { value: "dem", label: "Newsletter (dem)" },
    { value: "portal", label: "Portal" },
    { value: "magazine", label: "Magazine" },
];

const ServiceGroupsPage: FC = () => {
    const router = useRouter();
    const [rows, setRows] = useState<ServiceGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterName, setFilterName] = useState("");
    const [filterChannel, setFilterChannel] = useState("");

    const filteredRows = useMemo(() => {
        const nameQ = filterName.trim().toLowerCase();
        const channelQ = filterChannel.trim().toLowerCase();
        const filtered = rows.filter((g) => {
            if (nameQ) {
                const rawName = (g.service_group_name || "").toLowerCase();
                const spacedName = rawName.replace(/_/g, " ");
                if (!spacedName.includes(nameQ) && !rawName.includes(nameQ)) return false;
            }
            if (channelQ) {
                const ch = (g.service_group_channel || "").toLowerCase();
                if (ch !== channelQ) return false;
            }
            return true;
        });
        return filtered.sort((a, b) => {
            const ach = String(a.service_group_channel ?? "").toLowerCase();
            const bch = String(b.service_group_channel ?? "").toLowerCase();
            if (ach !== bch) return ach.localeCompare(bch);
            return String(a.service_group_name ?? "").localeCompare(String(b.service_group_name ?? ""), undefined, { sensitivity: "base" });
        });
    }, [rows, filterName, filterChannel]);

    useEffect(() => {
        ServiceGroupService.getAllServiceGroups()
            .then((list) => setRows(Array.isArray(list) ? list : []))
            .catch(() => setRows([]))
            .finally(() => setLoading(false));
    }, []);

    const breadcrumbs = [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Service groups" },
    ];

    const { setPageMeta } = usePageContent();
    useEffect(() => {
        setPageMeta({
            pageTitle: "Service groups",
            breadcrumbs,
            buttons: [{ label: "Create", href: "/logged/pages/production/service_groups/create" }],
        });
    }, [setPageMeta, breadcrumbs]);

    const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

    return (
        <PageContentSection>
            <div className="flex flex-col w-full">
                <div className="bg-white rounded-b-lg overflow-hidden">
                    <div className="p-6">
                        {loading ? (
                            <p className="text-sm text-gray-500">Loading…</p>
                        ) : rows.length === 0 ? (
                            <p className="text-sm text-gray-500">No service groups found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mb-4">
                                    <div>
                                        <label htmlFor="sg-filter-name" className="block text-xs text-gray-600 mb-1">
                                            Name
                                        </label>
                                        <input
                                            id="sg-filter-name"
                                            type="text"
                                            value={filterName}
                                            onChange={(e) => setFilterName(e.target.value)}
                                            placeholder="Search by name"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="sg-filter-channel" className="block text-xs text-gray-600 mb-1">
                                            Channel
                                        </label>
                                        <select
                                            id="sg-filter-channel"
                                            value={filterChannel}
                                            onChange={(e) => setFilterChannel(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            <option value="">All channels</option>
                                            {CHANNEL_FILTER_OPTIONS.map((c) => (
                                                <option key={c.value} value={c.value}>
                                                    {c.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {filteredRows.length === 0 ? (
                                    <p className="text-sm text-gray-500">No service groups match this filter.</p>
                                ) : (
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
                                            {filteredRows.map((g) => (
                                                <tr
                                                    key={g.service_group_id}
                                                    onClick={() =>
                                                        router.push(
                                                            `/logged/pages/production/service_groups/${encodeURIComponent(g.service_group_id)}`
                                                        )
                                                    }
                                                    className={rowClass}
                                                >
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        {g.service_group_name}
                                                    </td>
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
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageContentSection>
    );
};

export default ServiceGroupsPage;
