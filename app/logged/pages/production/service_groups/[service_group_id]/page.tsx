"use client";

import React, { FC, use, useEffect, useMemo, useState } from "react";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ServiceGroupService } from "@/app/service/ServiceGroupService";
import { ServiceService } from "@/app/service/ServiceService";

function parseStandardTariffEUR(s: string): number {
    const n = Number(String(s).trim().replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : 0;
}

type ServiceGroup = {
    service_group_id: string;
    service_group_name: string;
    service_group_channel: string;
    tariff_price_eur?: number;
    service_specifications?: string;
    service_base_description?: string;
};

type ServiceRow = {
    id_service: string;
    name: string;
    service_group_id?: string | null;
    tariff_price_eur?: number;
};

type Channel = "dem" | "portal" | "magazine";

const CHANNEL_OPTIONS: { value: Channel; label: string }[] = [
    { value: "dem", label: "Newsletter (dem)" },
    { value: "portal", label: "Portal" },
    { value: "magazine", label: "Magazine" },
];

const ServiceGroupDetailPage: FC<{ params: Promise<{ service_group_id: string }> }> = ({ params }) => {
    const { service_group_id } = use(params);
    const [group, setGroup] = useState<ServiceGroup | null>(null);
    const [services, setServices] = useState<ServiceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [editName, setEditName] = useState("");
    const [editChannel, setEditChannel] = useState<Channel | "">("");
    const [editTariff, setEditTariff] = useState("");
    const [editSpecifications, setEditSpecifications] = useState("");
    const [editBaseDescription, setEditBaseDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

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

    useEffect(() => {
        if (!group) return;
        setEditName(group.service_group_name ?? "");
        const ch = String(group.service_group_channel ?? "").toLowerCase();
        setEditChannel(CHANNEL_OPTIONS.some((o) => o.value === ch) ? (ch as Channel) : "");
        setEditTariff(String(Number(group.tariff_price_eur ?? 0)));
        setEditSpecifications(String(group.service_specifications ?? ""));
        setEditBaseDescription(String(group.service_base_description ?? ""));
    }, [group]);

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

    const dirty =
        !!group &&
        (editName !== (group.service_group_name ?? "") ||
            editChannel !== String(group.service_group_channel ?? "").toLowerCase() ||
            parseStandardTariffEUR(editTariff).toFixed(2) !==
                Number(group.tariff_price_eur ?? 0).toFixed(2) ||
            editSpecifications !== String(group.service_specifications ?? "") ||
            editBaseDescription !== String(group.service_base_description ?? ""));

    const canSave =
        dirty &&
        editName.trim().length > 0 &&
        editChannel !== "" &&
        !saving;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!group || !canSave) return;
        setSaving(true);
        setSaveError(null);
        try {
            const updated = await ServiceGroupService.updateServiceGroup(service_group_id, {
                service_group_name: editName.trim(),
                service_group_channel: editChannel,
                tariff_price_eur: parseStandardTariffEUR(editTariff),
                service_specifications: editSpecifications,
                service_base_description: editBaseDescription,
            });
            setGroup(updated);
        } catch (err: unknown) {
            const msg =
                typeof err === "object" && err !== null && "message" in err
                    ? String((err as { message?: string }).message)
                    : err instanceof Error
                      ? err.message
                      : "Could not update service group";
            setSaveError(msg);
        } finally {
            setSaving(false);
        }
    };

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
                        <p className="text-sm font-semibold text-gray-700 mb-1">Service group</p>
                        <p className="text-xs text-gray-500 mb-4">Edit the name exactly as you want it to be stored.</p>
                        <form onSubmit={handleSave} className="space-y-4 max-w-3xl">
                            <div>
                                <label htmlFor="sg-detail-id" className="block text-gray-500 text-xs uppercase tracking-wide mb-1">
                                    ID
                                </label>
                                <p id="sg-detail-id" className="font-mono text-sm text-gray-900 break-all">
                                    {group.service_group_id}
                                </p>
                            </div>
                            <div>
                                <label htmlFor="sg-detail-name" className="block text-xs text-gray-600 mb-1">
                                    Name
                                </label>
                                <input
                                    id="sg-detail-name"
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Newsletter Banner"
                                    autoComplete="off"
                                />
                            </div>
                            <div>
                                <label htmlFor="sg-detail-channel" className="block text-xs text-gray-600 mb-1">
                                    Channel
                                </label>
                                <select
                                    id="sg-detail-channel"
                                    value={editChannel}
                                    onChange={(e) => setEditChannel(e.target.value as Channel | "")}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option value="">Select channel…</option>
                                    {CHANNEL_OPTIONS.map((c) => (
                                        <option key={c.value} value={c.value}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                                {group.service_group_channel &&
                                    !CHANNEL_OPTIONS.some(
                                        (o) => o.value === String(group.service_group_channel).toLowerCase()
                                    ) && (
                                        <p className="text-xs text-amber-700 mt-1">
                                            Current DB value &quot;{group.service_group_channel}&quot; is not in the standard
                                            list; choose dem, portal, or magazine to save.
                                        </p>
                                    )}
                            </div>
                            <div>
                                <label htmlFor="sg-detail-tariff" className="block text-xs text-gray-600 mb-1">
                                    Standard tariff price (€)
                                </label>
                                <input
                                    id="sg-detail-tariff"
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={editTariff}
                                    onChange={(e) => setEditTariff(e.target.value)}
                                    className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="sg-detail-desc" className="block text-xs text-gray-600 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="sg-detail-desc"
                                    value={editBaseDescription}
                                    onChange={(e) => setEditBaseDescription(e.target.value)}
                                    rows={8}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Base description inherited by services in this group."
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    This description is inherited by services in this group.
                                </p>
                            </div>
                            <div>
                                <label htmlFor="sg-detail-specs" className="block text-xs text-gray-600 mb-1">
                                    Service specifications
                                </label>
                                <textarea
                                    id="sg-detail-specs"
                                    value={editSpecifications}
                                    onChange={(e) => setEditSpecifications(e.target.value)}
                                    rows={6}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Shared specifications for all services in this group."
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    These specifications are inherited by services in this group.
                                </p>
                            </div>
                            {saveError && (
                                <p className="text-sm text-red-600" role="alert">
                                    {saveError}
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={!canSave}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {saving ? "Saving…" : "Save changes"}
                            </button>
                        </form>
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
