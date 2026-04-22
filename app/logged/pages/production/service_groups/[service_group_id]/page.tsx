"use client";

import React, { FC, use, useEffect, useMemo, useState } from "react";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ServiceGroupService } from "@/app/service/ServiceGroupService";
import { ServiceService } from "@/app/service/ServiceService";

type ServiceGroup = {
    service_group_id: string;
    service_group_name: string;
    service_group_channel: string;
};

type ServiceRow = {
    id_service: string;
    name: string;
    service_group_id?: string | null;
    tariff_price_eur?: number;
};

const ServiceGroupDetailPage: FC<{ params: Promise<{ service_group_id: string }> }> = ({ params }) => {
    const { service_group_id } = use(params);
    const [group, setGroup] = useState<ServiceGroup | null>(null);
    const [services, setServices] = useState<ServiceRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            ServiceGroupService.getServiceGroupById(service_group_id).catch(() => null),
            ServiceService.getAllServices().catch(() => []),
        ])
            .then(([g, list]) => {
                if (cancelled) return;
                setGroup(g);
                const all = Array.isArray(list) ? list : [];
                setServices(
                    all.filter(
                        (s: ServiceRow) =>
                            s.service_group_id != null &&
                            String(s.service_group_id) === String(service_group_id)
                    )
                );
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [service_group_id]);

    const displayName = group?.service_group_name?.replace(/_/g, " ") ?? service_group_id;

    const breadcrumbs = useMemo(
        () => [
            { label: "Production", href: "/logged/pages/production/services" },
            { label: "Service groups", href: "/logged/pages/production/service_groups" },
            { label: displayName },
        ],
        [displayName]
    );

    const { setPageMeta } = usePageContent();
    useEffect(() => {
        setPageMeta({
            pageTitle: group ? `Service group: ${displayName}` : "Service group",
            breadcrumbs,
            buttons: [{ label: "Back to list", href: "/logged/pages/production/service_groups" }],
        });
    }, [setPageMeta, breadcrumbs, displayName, group]);

    if (loading) {
        return (
            <PageContentSection>
                <div className="flex flex-col w-full">
                    <div className="bg-white rounded-b-lg overflow-hidden p-6 text-sm text-gray-500">Loading…</div>
                </div>
            </PageContentSection>
        );
    }

    if (!group) {
        return (
            <PageContentSection>
                <div className="flex flex-col w-full">
                    <div className="bg-white rounded-b-lg overflow-hidden p-6 text-sm text-gray-500">
                        Service group not found.
                    </div>
                </div>
            </PageContentSection>
        );
    }

    return (
        <PageContentSection>
            <div className="flex flex-col w-full gap-6">
                <div className="bg-white rounded-b-lg overflow-hidden border border-gray-200">
                    <div className="p-6">
                        <p className="text-sm font-semibold text-gray-700 mb-4">Service group</p>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <dt className="text-gray-500 text-xs uppercase tracking-wide mb-1">ID</dt>
                                <dd className="font-mono text-gray-900 break-all">{group.service_group_id}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 text-xs uppercase tracking-wide mb-1">Name</dt>
                                <dd className="text-gray-900">{displayName}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 text-xs uppercase tracking-wide mb-1">Channel</dt>
                                <dd className="text-gray-900">{group.service_group_channel || "—"}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

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
            </div>
        </PageContentSection>
    );
};

export default ServiceGroupDetailPage;
