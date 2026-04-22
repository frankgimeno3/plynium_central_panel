"use client";

import React, { FC, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ServiceGroupService } from "@/app/service/ServiceGroupService";

type ServiceGroup = {
    service_group_id: string;
    service_group_name: string;
    service_group_channel: string;
};

const ServiceGroupsPage: FC = () => {
    const router = useRouter();
    const [rows, setRows] = useState<ServiceGroup[]>([]);
    const [loading, setLoading] = useState(true);

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
                                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Channel
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {rows.map((g) => (
                                            <tr
                                                key={g.service_group_id}
                                                onClick={() =>
                                                    router.push(
                                                        `/logged/pages/production/service_groups/${encodeURIComponent(g.service_group_id)}`
                                                    )
                                                }
                                                className={rowClass}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                                    {g.service_group_id}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {g.service_group_name?.replace(/_/g, " ")}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {g.service_group_channel || "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageContentSection>
    );
};

export default ServiceGroupsPage;
