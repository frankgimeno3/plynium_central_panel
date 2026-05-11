"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ServiceGroupService } from "@/app/service/ServiceGroupService";
import { ServiceService } from "@/app/service/ServiceService";

import { CHANNEL_OPTIONS } from "./service_group_detail_components/constants";
import type { ServiceGroupDetailChannel } from "./service_group_detail_components/constants";
import type { ServiceGroupDetailModel, ServiceGroupServiceRow } from "./service_group_detail_components/types";
import { parseStandardTariffEUR } from "./service_group_detail_components/serviceGroupDetailUtils";
import { ServiceGroupDetailLoadingPanel } from "./service_group_detail_components/ServiceGroupDetailLoadingPanel";
import { ServiceGroupDetailNotFoundPanel } from "./service_group_detail_components/ServiceGroupDetailNotFoundPanel";
import { ServiceGroupDetailEditForm } from "./service_group_detail_components/ServiceGroupDetailEditForm";
import { ServiceGroupServicesSection } from "./service_group_detail_components/ServiceGroupServicesSection";

export type ServiceGroupDetailPageProps = {
    serviceGroupId: string;
};

export const ServiceGroupDetailPage: FC<ServiceGroupDetailPageProps> = ({ serviceGroupId }) => {
    const [group, setGroup] = useState<ServiceGroupDetailModel | null>(null);
    const [services, setServices] = useState<ServiceGroupServiceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [editName, setEditName] = useState("");
    const [editChannel, setEditChannel] = useState<ServiceGroupDetailChannel | "">("");
    const [editTariff, setEditTariff] = useState("");
    const [editSpecifications, setEditSpecifications] = useState("");
    const [editBaseDescription, setEditBaseDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            ServiceGroupService.getServiceGroupById(serviceGroupId).catch(() => null),
            ServiceService.getAllServices().catch(() => []),
        ])
            .then(([g, list]) => {
                if (cancelled) return;
                setGroup(g);
                const all = Array.isArray(list) ? list : [];
                setServices(
                    all.filter(
                        (s: ServiceGroupServiceRow) =>
                            s.service_group_id != null && String(s.service_group_id) === String(serviceGroupId)
                    )
                );
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [serviceGroupId]);

    useEffect(() => {
        if (!group) return;
        setEditName(group.service_group_name ?? "");
        const ch = String(group.service_group_channel ?? "").toLowerCase();
        setEditChannel(CHANNEL_OPTIONS.some((o) => o.value === ch) ? (ch as ServiceGroupDetailChannel) : "");
        setEditTariff(String(Number(group.tariff_price_eur ?? 0)));
        setEditSpecifications(String(group.service_specifications ?? ""));
        setEditBaseDescription(String(group.service_base_description ?? ""));
    }, [group]);

    const displayName = group?.service_group_name?.replace(/_/g, " ") ?? serviceGroupId;

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
            parseStandardTariffEUR(editTariff).toFixed(2) !== Number(group.tariff_price_eur ?? 0).toFixed(2) ||
            editSpecifications !== String(group.service_specifications ?? "") ||
            editBaseDescription !== String(group.service_base_description ?? ""));

    const canSave =
        dirty && editName.trim().length > 0 && editChannel !== "" && !saving;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!group || !canSave) return;
        setSaving(true);
        setSaveError(null);
        try {
            const updated = await ServiceGroupService.updateServiceGroup(serviceGroupId, {
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
        return <ServiceGroupDetailLoadingPanel />;
    }

    if (!group) {
        return <ServiceGroupDetailNotFoundPanel />;
    }

    return (
        <PageContentSection>
            <div className="flex flex-col w-full gap-6">
                <ServiceGroupDetailEditForm
                    group={group}
                    editName={editName}
                    onEditNameChange={setEditName}
                    editChannel={editChannel}
                    onEditChannelChange={setEditChannel}
                    editTariff={editTariff}
                    onEditTariffChange={setEditTariff}
                    editBaseDescription={editBaseDescription}
                    onEditBaseDescriptionChange={setEditBaseDescription}
                    editSpecifications={editSpecifications}
                    onEditSpecificationsChange={setEditSpecifications}
                    saveError={saveError}
                    canSave={canSave}
                    saving={saving}
                    onSubmit={handleSave}
                />
                <ServiceGroupServicesSection services={services} />
            </div>
        </PageContentSection>
    );
};
