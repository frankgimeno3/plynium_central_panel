"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ServiceService } from "@/app/service/ServiceService";
import { ServiceGroupService } from "@/app/service/ServiceGroupService";
import { PortalService } from "@/app/service/PortalService";
import { MagazineService } from "@/app/service/MagazineService";
import { PublicationService } from "@/app/service/PublicationService";

type Step = 1 | 2 | 3 | 4;
type Channel = "dem" | "portal" | "magazine";

type ServiceGroupRow = {
    service_group_id: string;
    service_group_name: string;
    service_group_channel: Channel;
    tariff_price_eur?: number;
    service_specifications?: string;
    service_base_description?: string;
};

type PortalRow = { id: number; name: string };
type MagazineRow = { id_magazine: string; name: string };
type PublicationRow = {
    id_publication: string;
    edition_name?: string;
    publication_edition_name?: string;
    publication_year?: number | null;
};
type CampaignRow = { id: string; name: string };

function channelLabel(ch: Channel): string {
    if (ch === "dem") return "Newsletter (dem)";
    if (ch === "portal") return "Portal";
    return "Magazine";
}

/** Preview only; authoritative id comes from POST `mint_catalog_service_id`. */
function suggestNextCatalogServiceId(
    allServices: { id_service: string }[],
    year: number = new Date().getFullYear()
): string {
    const yr = String(year);
    const re = new RegExp(`^srv_${yr}_(\\d{5})$`);
    let max = 0;
    for (const s of allServices) {
        const id = String(s?.id_service ?? "").trim();
        const m = id.match(re);
        if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `srv_${yr}_${String(max + 1).padStart(5, "0")}`;
}

function getPublicationEditionLabel(p: PublicationRow): string {
    return String(p.publication_edition_name ?? p.edition_name ?? p.id_publication);
}

function publicationYearsDescending(pubs: PublicationRow[]): number[] {
    const ys = new Set<number>();
    for (const p of pubs) {
        const y = p.publication_year;
        const n = y == null ? NaN : Number(y);
        if (Number.isFinite(n)) ys.add(Math.trunc(n));
    }
    return Array.from(ys).sort((a, b) => b - a);
}

type CustomState =
    | {
          channel: "dem";
          publicationMonth: string;
          publicationYear: string;
          portalId: string;
          campaignId: string;
          campaignName: string;
      }
    | { channel: "portal"; portalId: string; portalName: string }
    | {
          channel: "magazine";
          magazineId: string;
          magazineName: string;
          publicationYear: string;
          publicationId: string;
          publicationEditionName: string;
      };

type FormState = {
    id_service: string;
    service_group_channel: Channel | "";
    service_group_id: string;
    custom: CustomState | null;
    service_description: string;
    service_unit_specifications: string;
    final_service_name: string;
};

const initialForm: FormState = {
    id_service: "",
    service_group_channel: "",
    service_group_id: "",
    custom: null,
    service_description: "",
    service_unit_specifications: "",
    final_service_name: "",
};

const CreateServicePage: FC = () => {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [submitting, setSubmitting] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(initialForm);

    const [allServices, setAllServices] = useState<{ id_service: string }[]>([]);
    const [serviceGroups, setServiceGroups] = useState<ServiceGroupRow[]>([]);
    const [portals, setPortals] = useState<PortalRow[]>([]);
    const [magazines, setMagazines] = useState<MagazineRow[]>([]);
    const [magazinePublications, setMagazinePublications] = useState<PublicationRow[]>([]);
    const [campaignsForPortal, setCampaignsForPortal] = useState<CampaignRow[]>([]);

    useEffect(() => {
        ServiceService.getAllServices()
            .then((list) => setAllServices(Array.isArray(list) ? list : []))
            .catch(() => setAllServices([]));
    }, []);

    useEffect(() => {
        ServiceGroupService.getAllServiceGroups()
            .then((list) => setServiceGroups(Array.isArray(list) ? list : []))
            .catch(() => setServiceGroups([]));
    }, []);

    useEffect(() => {
        PortalService.getAllPortals()
            .then((list) => setPortals(Array.isArray(list) ? list : []))
            .catch(() => setPortals([]));
    }, []);

    useEffect(() => {
        MagazineService.getAllMagazines()
            .then((list) => setMagazines(Array.isArray(list) ? list : []))
            .catch(() => setMagazines([]));
    }, []);

    const backUrl = "/logged/pages/production/services";
    const breadcrumbs = [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Services", href: backUrl },
        { label: "Create service" },
    ];
    const { setPageMeta } = usePageContent();
    useEffect(() => {
        setPageMeta({
            pageTitle: "Create service",
            breadcrumbs,
            buttons: [{ label: "Back", href: backUrl }],
        });
    }, [setPageMeta]);

    const nextId = useMemo(
        () => suggestNextCatalogServiceId(allServices, new Date().getFullYear()),
        [allServices]
    );
    const displayId = form.id_service || nextId;

    const channels = useMemo(() => {
        const set = new Set<string>();
        for (const g of serviceGroups) set.add(String(g.service_group_channel ?? "").toLowerCase());
        const ordered: Channel[] = ["dem", "portal", "magazine"];
        return ordered.filter((c) => set.has(c));
    }, [serviceGroups]);

    const groupsForChannel = useMemo(() => {
        if (!form.service_group_channel) return [];
        return serviceGroups
            .filter((g) => String(g.service_group_channel).toLowerCase() === form.service_group_channel)
            .sort((a, b) => String(a.service_group_name).localeCompare(String(b.service_group_name)));
    }, [serviceGroups, form.service_group_channel]);

    const selectedGroup = useMemo(
        () => serviceGroups.find((g) => g.service_group_id === form.service_group_id) ?? null,
        [serviceGroups, form.service_group_id]
    );

    useEffect(() => {
        if (!form.custom || form.custom.channel !== "magazine") return;
        const mid = form.custom.magazineId;
        if (!mid) {
            setMagazinePublications([]);
            return;
        }
        PublicationService.listPublicationsForMagazine(mid)
            .then((list: any[]) => {
                const rows = Array.isArray(list) ? list : [];
                setMagazinePublications(
                    rows
                        .filter((x) => x && typeof x === "object")
                        .map((x: any) => ({
                            id_publication: String(x.id_publication ?? x.publication_id ?? x.id ?? "").trim(),
                            edition_name: x.edition_name != null ? String(x.edition_name) : undefined,
                            publication_edition_name:
                                x.publication_edition_name != null ? String(x.publication_edition_name) : undefined,
                            publication_year:
                                x.publication_year != null && String(x.publication_year).trim() !== ""
                                    ? Number(x.publication_year)
                                    : null,
                        }))
                        .filter((p) => p.id_publication.length > 0)
                );
            })
            .catch(() => setMagazinePublications([]));
    }, [form.custom]);

    useEffect(() => {
        if (!form.custom || form.custom.channel !== "dem") return;
        const pid = form.custom.portalId;
        if (!pid) {
            setCampaignsForPortal([]);
            return;
        }
        PortalService.getNewsletterCampaignsForPortal(pid)
            .then((list: any[]) => {
                const rows = Array.isArray(list) ? list : [];
                setCampaignsForPortal(
                    rows
                        .filter((x) => x && typeof x === "object")
                        .map((x: any) => ({ id: String(x.id ?? "").trim(), name: String(x.name ?? "").trim() }))
                        .filter((c) => c.id && c.name)
                );
            })
            .catch(() => setCampaignsForPortal([]));
    }, [form.custom]);

    const magazinePublicationYears = useMemo(() => {
        if (!form.custom || form.custom.channel !== "magazine" || !form.custom.magazineId) return [];
        return publicationYearsDescending(magazinePublications);
    }, [form.custom, magazinePublications]);

    const publicationsForMagazineYear = useMemo(() => {
        if (!form.custom || form.custom.channel !== "magazine") return [];
        const yStr = form.custom.publicationYear?.trim();
        if (!yStr) return [];
        const y = Number(yStr);
        if (!Number.isFinite(y)) return [];
        return magazinePublications.filter((p) => {
            const py = p.publication_year == null ? NaN : Number(p.publication_year);
            return Number.isFinite(py) && Math.trunc(py) === Math.trunc(y);
        });
    }, [form.custom, magazinePublications]);

    const canAdvanceStep1 = !!form.service_group_channel && !!form.service_group_id;

    const canAdvanceStep2 = useMemo(() => {
        if (!form.custom) return false;
        if (form.custom.channel === "portal") return !!form.custom.portalId;
        if (form.custom.channel === "magazine")
            return (
                !!form.custom.magazineId &&
                !!form.custom.publicationYear.trim() &&
                !!form.custom.publicationId
            );
        const m = Number(form.custom.publicationMonth);
        const y = Number(form.custom.publicationYear);
        return (
            Number.isFinite(m) &&
            m >= 1 &&
            m <= 12 &&
            Number.isFinite(y) &&
            y >= 2000 &&
            y <= 2100 &&
            !!form.custom.portalId &&
            !!form.custom.campaignId
        );
    }, [form.custom]);

    const canAdvanceStep3 = form.service_description.trim().length > 0;

    const suggestedName = useMemo(() => {
        if (!selectedGroup || !form.custom) return "";
        const groupName = selectedGroup.service_group_name ?? "";
        if (form.custom.channel === "portal") return `${form.custom.portalName}-${groupName}`.trim();
        if (form.custom.channel === "magazine") return `${form.custom.publicationEditionName}-${groupName}`.trim();
        return `${form.custom.campaignName}-${groupName}`.trim();
    }, [selectedGroup, form.custom]);

    const canCreate =
        form.final_service_name.trim().length > 0 && canAdvanceStep3 && !!selectedGroup && !!form.custom;

    const goNext = () => {
        if (step === 1 && canAdvanceStep1) {
            setForm((f) => ({
                ...f,
                id_service: "",
                custom:
                    f.service_group_channel === "dem"
                        ? {
                              channel: "dem",
                              publicationMonth: "",
                              publicationYear: String(new Date().getFullYear()),
                              portalId: "",
                              campaignId: "",
                              campaignName: "",
                          }
                        : f.service_group_channel === "portal"
                          ? { channel: "portal", portalId: "", portalName: "" }
                          : {
                                channel: "magazine",
                                magazineId: "",
                                magazineName: "",
                                publicationYear: "",
                                publicationId: "",
                                publicationEditionName: "",
                            },
            }));
            setStep(2);
            return;
        }
        if (step === 2 && canAdvanceStep2) {
            const baseDesc = String((selectedGroup as any)?.service_base_description ?? "").trim();
            const baseSpecs = String((selectedGroup as any)?.service_specifications ?? "").trim();
            let desc = baseDesc;
            if (form.custom?.channel === "dem") {
                const extra = `\n\nPublication month: ${form.custom.publicationMonth}/${form.custom.publicationYear}\nNewsletter campaign: ${form.custom.campaignName}`;
                desc = desc ? desc + extra : extra.trimStart();
            }
            if (form.custom?.channel === "magazine") {
                const extra = `\n\nMagazine: ${form.custom.magazineName}\nEdition: ${form.custom.publicationEditionName} (${form.custom.publicationYear})`;
                desc = desc ? desc + extra : extra.trimStart();
            }
            setForm((f) => ({
                ...f,
                service_description: desc,
                service_unit_specifications: baseSpecs,
            }));
            setStep(3);
            return;
        }
        if (step === 3 && canAdvanceStep3) {
            setForm((f) => ({ ...f, final_service_name: f.final_service_name || suggestedName }));
            setStep(4);
        }
    };

    const goBack = () => {
        if (step > 1) setStep((s) => (s - 1) as Step);
    };

    const handleCreate = async () => {
        if (!selectedGroup || !form.custom) return;
        setSubmitting(true);
        setCreateError(null);
        try {
            const portalId =
                form.custom.channel === "portal"
                    ? Number(form.custom.portalId || 0)
                    : form.custom.channel === "dem"
                      ? Number(form.custom.portalId || 0)
                      : 0;

            const created = await ServiceService.createService({
                mint_catalog_service_id: true,
                name: form.final_service_name.trim(),
                service_group_id: selectedGroup.service_group_id,
                service_portal: Number.isFinite(portalId) ? portalId : 0,
                service_description: form.service_description,
                service_unit_specifications: form.service_unit_specifications,
                tariff_price_eur: Number(selectedGroup.tariff_price_eur ?? 0),
            });
            const newId =
                typeof created?.id_service === "string"
                    ? created.id_service
                    : typeof created?.service_id === "string"
                      ? created.service_id
                      : "";
            if (!newId) {
                throw new Error("Create succeeded but no service id returned");
            }
            router.push(`/logged/pages/production/services/${encodeURIComponent(newId)}`);
        } catch (err: unknown) {
            const msg =
                typeof err === "object" && err !== null && "message" in err
                    ? String((err as { message?: string }).message)
                    : err instanceof Error
                      ? err.message
                      : "Could not create service";
            setCreateError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageContentSection>
            <div className="flex flex-col w-full">
                <div className="flex border-b border-gray-200 bg-gray-50">
                    <div className="p-6 flex-1">
                        <div className="flex items-center gap-4">
                            {([1, 2, 3, 4] as Step[]).map((s) => (
                                <React.Fragment key={s}>
                                    <button
                                        type="button"
                                        onClick={() => s < step && setStep(s)}
                                        className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                                            step === s
                                                ? "bg-blue-600 text-white"
                                                : step > s
                                                  ? "bg-green-100 text-green-800"
                                                  : "bg-gray-200 text-gray-500"
                                        } ${step > s ? "cursor-pointer" : ""}`}
                                    >
                                        {s}
                                    </button>
                                    {s < 4 && <span className="w-8 h-0.5 bg-gray-300" />}
                                </React.Fragment>
                            ))}
                            <span className="text-sm text-gray-600 ml-2">
                                {step === 1 && "Channel + service group"}
                                {step === 2 && "Custom fields"}
                                {step === 3 && "Description + specifications"}
                                {step === 4 && "Name + review"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-b-lg overflow-hidden">
                    <div className="p-6 w-full">
                        {step === 1 && (
                            <div className="space-y-6 max-w-2xl">
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Service ID</p>
                                    <p className="text-base font-mono font-medium text-gray-900">{displayId}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        This will be the ID assigned to the new service.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">
                                            Service channel <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={form.service_group_channel}
                                            onChange={(e) => {
                                                const ch = e.target.value as Channel | "";
                                                setForm((f) => ({
                                                    ...f,
                                                    service_group_channel: ch,
                                                    service_group_id: "",
                                                    custom: null,
                                                }));
                                            }}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            <option value="">Select channel…</option>
                                            {channels.map((c) => (
                                                <option key={c} value={c}>
                                                    {channelLabel(c)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">
                                            Service group <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={form.service_group_id}
                                            onChange={(e) => setForm((f) => ({ ...f, service_group_id: e.target.value }))}
                                            disabled={!form.service_group_channel}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-60"
                                        >
                                            <option value="">Select service group…</option>
                                            {groupsForChannel.map((g) => (
                                                <option key={g.service_group_id} value={g.service_group_id}>
                                                    {g.service_group_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={goNext}
                                        disabled={!canAdvanceStep1}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next: Custom
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && form.custom && (
                            <div className="space-y-6 max-w-2xl">
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Selection</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Channel: {form.custom.channel} · Group: {selectedGroup?.service_group_name ?? "—"}
                                    </p>
                                </div>

                                {form.custom.channel === "dem" && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">
                                                    Publication month <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={12}
                                                    value={form.custom.publicationMonth}
                                                    onChange={(e) =>
                                                        setForm((f) => ({
                                                            ...f,
                                                            custom:
                                                                f.custom && f.custom.channel === "dem"
                                                                    ? { ...f.custom, publicationMonth: e.target.value }
                                                                    : f.custom,
                                                        }))
                                                    }
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                                    placeholder="1-12"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">
                                                    Year <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min={2000}
                                                    max={2100}
                                                    value={form.custom.publicationYear}
                                                    onChange={(e) =>
                                                        setForm((f) => ({
                                                            ...f,
                                                            custom:
                                                                f.custom && f.custom.channel === "dem"
                                                                    ? { ...f.custom, publicationYear: e.target.value }
                                                                    : f.custom,
                                                        }))
                                                    }
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                                    placeholder="YYYY"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                                Portal <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={form.custom.portalId}
                                                onChange={(e) => {
                                                    const pid = e.target.value;
                                                    setForm((f) => ({
                                                        ...f,
                                                        custom:
                                                            f.custom && f.custom.channel === "dem"
                                                                ? { ...f.custom, portalId: pid, campaignId: "", campaignName: "" }
                                                                : f.custom,
                                                    }));
                                                    setCampaignsForPortal([]);
                                                }}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                                            >
                                                <option value="">Select portal…</option>
                                                {portals.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {form.custom.portalId && (
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">
                                                    Newsletter campaign <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={form.custom.campaignId}
                                                    onChange={(e) => {
                                                        const cid = e.target.value;
                                                        const c = campaignsForPortal.find((x) => x.id === cid);
                                                        setForm((f) => ({
                                                            ...f,
                                                            custom:
                                                                f.custom && f.custom.channel === "dem"
                                                                    ? { ...f.custom, campaignId: cid, campaignName: c?.name ?? "" }
                                                                    : f.custom,
                                                        }));
                                                    }}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                                                >
                                                    <option value="">Select campaign…</option>
                                                    {campaignsForPortal.map((c) => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {form.custom.channel === "portal" && (
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">
                                            Portal <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={form.custom.portalId}
                                            onChange={(e) => {
                                                const pid = e.target.value;
                                                const p = portals.find((x) => String(x.id) === String(pid));
                                                setForm((f) => ({
                                                    ...f,
                                                    custom:
                                                        f.custom && f.custom.channel === "portal"
                                                            ? { ...f.custom, portalId: pid, portalName: p?.name ?? "" }
                                                            : f.custom,
                                                }));
                                            }}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                                        >
                                            <option value="">Select portal…</option>
                                            {portals.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {form.custom.channel === "magazine" && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                                Magazine <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={form.custom.magazineId}
                                                onChange={(e) => {
                                                    const mid = e.target.value;
                                                    const m = magazines.find((x) => x.id_magazine === mid);
                                                    setForm((f) => ({
                                                        ...f,
                                                        custom:
                                                            f.custom && f.custom.channel === "magazine"
                                                                ? {
                                                                      ...f.custom,
                                                                      magazineId: mid,
                                                                      magazineName: m?.name ?? "",
                                                                      publicationYear: "",
                                                                      publicationId: "",
                                                                      publicationEditionName: "",
                                                                  }
                                                                : f.custom,
                                                    }));
                                                    setMagazinePublications([]);
                                                }}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                                            >
                                                <option value="">Select magazine…</option>
                                                {magazines.map((m) => (
                                                    <option key={m.id_magazine} value={m.id_magazine}>
                                                        {m.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {form.custom.magazineId && (
                                            <>
                                                {magazinePublicationYears.length === 0 && magazinePublications.length === 0 ? (
                                                    <p className="text-sm text-gray-500">
                                                        Loading editions… If this persists, this magazine may have no
                                                        publications yet.
                                                    </p>
                                                ) : magazinePublicationYears.length === 0 ? (
                                                    <p className="text-sm text-amber-700">
                                                        No editions with a valid publication year were found for this
                                                        magazine. Check that{" "}
                                                        <span className="font-mono text-xs">publication_year</span> is set
                                                        in RDS.
                                                    </p>
                                                ) : (
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1">
                                                            Publication year <span className="text-red-500">*</span>
                                                        </label>
                                                        <select
                                                            value={form.custom.publicationYear}
                                                            onChange={(e) => {
                                                                const year = e.target.value;
                                                                setForm((f) => ({
                                                                    ...f,
                                                                    custom:
                                                                        f.custom && f.custom.channel === "magazine"
                                                                            ? {
                                                                                  ...f.custom,
                                                                                  publicationYear: year,
                                                                                  publicationId: "",
                                                                                  publicationEditionName: "",
                                                                              }
                                                                            : f.custom,
                                                                }));
                                                            }}
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                                                        >
                                                            <option value="">Select year…</option>
                                                            {magazinePublicationYears.map((y) => (
                                                                <option key={y} value={String(y)}>
                                                                    {y}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {form.custom.publicationYear.trim() !== "" && (
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1">
                                                            Publication edition <span className="text-red-500">*</span>
                                                        </label>
                                                        {publicationsForMagazineYear.length === 0 ? (
                                                            <p className="text-sm text-gray-500">
                                                                No editions for year {form.custom.publicationYear}.
                                                            </p>
                                                        ) : (
                                                            <select
                                                                value={form.custom.publicationId}
                                                                onChange={(e) => {
                                                                    const pid = e.target.value;
                                                                    const p = publicationsForMagazineYear.find(
                                                                        (x) => x.id_publication === pid
                                                                    );
                                                                    setForm((f) => ({
                                                                        ...f,
                                                                        custom:
                                                                            f.custom && f.custom.channel === "magazine"
                                                                                ? {
                                                                                      ...f.custom,
                                                                                      publicationId: pid,
                                                                                      publicationEditionName: p
                                                                                          ? getPublicationEditionLabel(p)
                                                                                          : "",
                                                                                  }
                                                                                : f.custom,
                                                                    }));
                                                                }}
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                                                            >
                                                                <option value="">Select edition…</option>
                                                                {publicationsForMagazineYear.map((p) => (
                                                                    <option
                                                                        key={p.id_publication}
                                                                        value={p.id_publication}
                                                                    >
                                                                        {getPublicationEditionLabel(p)}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={goBack}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={goNext}
                                        disabled={!canAdvanceStep2}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next: Description
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 max-w-3xl">
                                <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-gray-800" role="note">
                                    <p className="font-medium text-gray-900 mb-1">Inherited from service group</p>
                                    <p>
                                        Description and specifications are inherited from the service group. You can edit them here for this
                                        specific service. Service-specific values override the group defaults when used in proposals, and agents
                                        can still adjust them again on the proposal.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Description</label>
                                    <textarea
                                        value={form.service_description}
                                        onChange={(e) => setForm((f) => ({ ...f, service_description: e.target.value }))}
                                        rows={10}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Specifications</label>
                                    <textarea
                                        value={form.service_unit_specifications}
                                        onChange={(e) => setForm((f) => ({ ...f, service_unit_specifications: e.target.value }))}
                                        rows={8}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={goBack}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={goNext}
                                        disabled={!canAdvanceStep3}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next: Review
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6 max-w-3xl">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                        Service name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.final_service_name}
                                        onChange={(e) => setForm((f) => ({ ...f, final_service_name: e.target.value }))}
                                        placeholder={suggestedName || "Enter service name"}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                    />
                                    {!!suggestedName && (
                                        <button
                                            type="button"
                                            onClick={() => setForm((f) => ({ ...f, final_service_name: suggestedName }))}
                                            className="mt-2 text-sm text-blue-600 hover:underline"
                                        >
                                            Use suggested: {suggestedName}
                                        </button>
                                    )}
                                </div>

                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Review</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Service ID</p>
                                            <p className="font-mono text-sm">{displayId}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Name</p>
                                            <p className="text-sm">{form.final_service_name || "—"}</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-gray-500 uppercase">Channel / group</p>
                                            <p className="text-sm">
                                                {form.service_group_channel ? channelLabel(form.service_group_channel as Channel) : "—"} ·{" "}
                                                {selectedGroup?.service_group_name ?? "—"}
                                            </p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-gray-500 uppercase">Description</p>
                                            <p className="text-sm whitespace-pre-wrap">{form.service_description}</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-gray-500 uppercase">Specifications</p>
                                            <p className="text-sm whitespace-pre-wrap">{form.service_unit_specifications}</p>
                                        </div>
                                    </div>
                                </div>

                                {createError && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {createError}
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={goBack}
                                        disabled={submitting}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCreate}
                                        disabled={submitting || !canCreate}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? "Creating…" : "Create service"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageContentSection>
    );
};

export default CreateServicePage;

