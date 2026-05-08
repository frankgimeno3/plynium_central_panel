"use client";

import React, { FC, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ServiceGroupService } from "@/app/service/ServiceGroupService";

type Channel = "dem" | "portal" | "magazine" | "";

const CHANNEL_OPTIONS: { value: Exclude<Channel, "">; label: string }[] = [
    { value: "dem", label: "Newsletter (dem)" },
    { value: "portal", label: "Portal" },
    { value: "magazine", label: "Magazine" },
];

const BASE = "/logged/pages/production/service_groups";

const CreateServiceGroupPage: FC = () => {
    const router = useRouter();
    const [service_group_name, setServiceGroupName] = useState("");
    const [service_group_channel, setServiceGroupChannel] = useState<Channel>("");
    const [tariff_price_eur, setTariffPriceEur] = useState("0");
    const [service_base_description, setServiceBaseDescription] = useState("");
    const [service_specifications, setServiceSpecifications] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const breadcrumbs = [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Service groups", href: BASE },
        { label: "Create" },
    ];

    const { setPageMeta } = usePageContent();
    useEffect(() => {
        setPageMeta({
            pageTitle: "Create service group",
            breadcrumbs,
            buttons: [{ label: "Back", href: BASE }],
        });
    }, [setPageMeta, breadcrumbs]);

    const canSubmit =
        service_group_name.trim().length > 0 &&
        service_group_channel !== "" &&
        !submitting;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);
        try {
            const t = Number(String(tariff_price_eur).replace(",", "."));
            const created = await ServiceGroupService.createServiceGroup({
                service_group_name: service_group_name.trim(),
                service_group_channel,
                tariff_price_eur: Number.isFinite(t) && t >= 0 ? t : 0,
                service_base_description,
                service_specifications,
            });
            const id = created?.service_group_id;
            if (id) {
                router.push(`${BASE}/${encodeURIComponent(id)}`);
            } else {
                router.push(BASE);
            }
        } catch (err: unknown) {
            const msg =
                typeof err === "object" && err !== null && "message" in err
                    ? String((err as { message?: string }).message)
                    : err instanceof Error
                      ? err.message
                      : "Could not create service group";
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageContentSection>
            <div className="flex flex-col w-full max-w-xl">
                <div className="bg-white rounded-b-lg border border-gray-200 overflow-hidden">
                    <div className="p-6">
                        <p className="text-sm font-semibold text-gray-700 mb-1">New service group</p>
                        <p className="text-xs text-gray-500 mb-6">
                            Name is stored as lowercase snake_case (letters, numbers, underscores). UUID is assigned
                            automatically.
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="sg-name" className="block text-xs text-gray-600 mb-1">
                                    Name
                                </label>
                                <input
                                    id="sg-name"
                                    type="text"
                                    value={service_group_name}
                                    onChange={(e) => setServiceGroupName(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Newsletter Banner"
                                    autoComplete="off"
                                />
                            </div>
                            <div>
                                <label htmlFor="sg-channel" className="block text-xs text-gray-600 mb-1">
                                    Channel
                                </label>
                                <select
                                    id="sg-channel"
                                    value={service_group_channel}
                                    onChange={(e) => setServiceGroupChannel(e.target.value as Channel)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option value="">Select channel…</option>
                                    {CHANNEL_OPTIONS.map((c) => (
                                        <option key={c.value} value={c.value}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="sg-tariff" className="block text-xs text-gray-600 mb-1">
                                    Standard tariff price (€)
                                </label>
                                <input
                                    id="sg-tariff"
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={tariff_price_eur}
                                    onChange={(e) => setTariffPriceEur(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="sg-description" className="block text-xs text-gray-600 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="sg-description"
                                    value={service_base_description}
                                    onChange={(e) => setServiceBaseDescription(e.target.value)}
                                    rows={8}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Base description inherited by services in this group."
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    This description is inherited by services in this group.
                                </p>
                            </div>
                            <div>
                                <label htmlFor="sg-specs" className="block text-xs text-gray-600 mb-1">
                                    Service specifications
                                </label>
                                <textarea
                                    id="sg-specs"
                                    value={service_specifications}
                                    onChange={(e) => setServiceSpecifications(e.target.value)}
                                    rows={6}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Shared specifications for all services in this group."
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    These specifications are inherited by services in this group.
                                </p>
                            </div>
                            {error && (
                                <p className="text-sm text-red-600" role="alert">
                                    {error}
                                </p>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => router.push(BASE)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? "Creating…" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </PageContentSection>
    );
};

export default CreateServiceGroupPage;
