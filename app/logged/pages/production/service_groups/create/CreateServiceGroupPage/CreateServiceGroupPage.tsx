"use client";

import React, { FC, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ServiceGroupService } from "@/app/service/ServiceGroupService";

import { BASE } from "./create_service_group_components/constants";
import type { ServiceGroupChannelOption } from "./create_service_group_components/types";
import { CreateServiceGroupIntro } from "./create_service_group_components/CreateServiceGroupIntro";
import { CreateServiceGroupBasicsFields } from "./create_service_group_components/CreateServiceGroupBasicsFields";
import { CreateServiceGroupDescriptionFields } from "./create_service_group_components/CreateServiceGroupDescriptionFields";
import { CreateServiceGroupFormActions } from "./create_service_group_components/CreateServiceGroupFormActions";

const CreateServiceGroupPage: FC = () => {
    const router = useRouter();
    const [service_group_name, setServiceGroupName] = useState("");
    const [service_group_channel, setServiceGroupChannel] = useState<ServiceGroupChannelOption>("");
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
        service_group_name.trim().length > 0 && service_group_channel !== "" && !submitting;

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
                        <CreateServiceGroupIntro />
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <CreateServiceGroupBasicsFields
                                service_group_name={service_group_name}
                                onServiceGroupNameChange={setServiceGroupName}
                                service_group_channel={service_group_channel}
                                onServiceGroupChannelChange={setServiceGroupChannel}
                                tariff_price_eur={tariff_price_eur}
                                onTariffPriceEurChange={setTariffPriceEur}
                            />
                            <CreateServiceGroupDescriptionFields
                                service_base_description={service_base_description}
                                onServiceBaseDescriptionChange={setServiceBaseDescription}
                                service_specifications={service_specifications}
                                onServiceSpecificationsChange={setServiceSpecifications}
                            />
                            <CreateServiceGroupFormActions
                                error={error}
                                submitting={submitting}
                                canSubmit={canSubmit}
                                onCancel={() => router.push(BASE)}
                            />
                        </form>
                    </div>
                </div>
            </div>
        </PageContentSection>
    );
};

export default CreateServiceGroupPage;
