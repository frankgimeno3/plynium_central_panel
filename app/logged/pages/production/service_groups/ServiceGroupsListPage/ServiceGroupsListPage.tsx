"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ServiceGroupService } from "@/app/service/ServiceGroupService";

import type { ServiceGroupListRow } from "./service_groups_list_components/types";
import { ServiceGroupsFilterForm } from "./service_groups_list_components/ServiceGroupsFilterForm";
import { ServiceGroupsTable } from "./service_groups_list_components/ServiceGroupsTable";

const ServiceGroupsListPage: FC = () => {
    const router = useRouter();
    const [rows, setRows] = useState<ServiceGroupListRow[]>([]);
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
            return String(a.service_group_name ?? "").localeCompare(String(b.service_group_name ?? ""), undefined, {
                sensitivity: "base",
            });
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

    const navigateToGroup = (serviceGroupId: string) => {
        router.push(`/logged/pages/production/service_groups/${encodeURIComponent(serviceGroupId)}`);
    };

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
                                <ServiceGroupsFilterForm
                                    filterName={filterName}
                                    filterChannel={filterChannel}
                                    onFilterNameChange={setFilterName}
                                    onFilterChannelChange={setFilterChannel}
                                />
                                {filteredRows.length === 0 ? (
                                    <p className="text-sm text-gray-500">No service groups match this filter.</p>
                                ) : (
                                    <ServiceGroupsTable
                                        rows={filteredRows}
                                        rowClassName={rowClass}
                                        onRowNavigate={navigateToGroup}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageContentSection>
    );
};

export default ServiceGroupsListPage;
