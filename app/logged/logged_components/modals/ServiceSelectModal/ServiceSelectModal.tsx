"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import { ServiceService } from "@/app/service/ServiceService";
import { PortalService } from "@/app/service/PortalService";
import { MagazineService } from "@/app/service/MagazineService";
import { PublicationService } from "@/app/service/PublicationService";

import type {
  MagazineOption,
  PortalOption,
  PublicationEditionRow,
  ServiceEntity,
  ServiceExtra,
  ServiceLineDraft,
  ServiceRow,
  ServiceSelectModalProps,
} from "./modal_service_select_components/types";
import {
  channelLabel,
  isMagazineAdvertService,
  monthsBetween,
  publicationEditionLabel,
} from "./modal_service_select_components/helpers";
import { ServiceAdvertPageTypeList } from "./modal_service_select_components/ServiceAdvertPageTypeList";
import {
  MagazineServicePickerPhase,
  type MagazinePickerSelection,
} from "./modal_service_select_components/MagazineServicePickerPhase";
import { isPreferentialCatalogKey, deriveMagazinePageTypeAndSlotKey } from "./modal_service_select_components/magazineCatalog";
import { ServiceLineConfirmFields } from "./modal_service_select_components/ServiceLineConfirmFields";

export type { ServiceRow, ServiceExtra, ServiceLineDraft } from "./modal_service_select_components/types";

function specifitySortKey(value?: string): number {
  if (value === "general") return 0;
  if (value === "specific-related") return 1;
  return 2;
}

function serviceChannel(s: ServiceEntity): string {
  const ch = String(s.service_channel ?? s.service_group_channel ?? "").trim().toLowerCase();
  if (ch) return ch;
  const typeMap: Record<string, string> = { newsletter: "dem", portal: "portal", magazine: "magazine" };
  return typeMap[String(s.service_type ?? "").toLowerCase()] ?? "";
}

function serviceLabel(s: ServiceEntity): string {
  const shown = String(s.shown_name ?? "").trim();
  if (shown) return shown;
  return String(s.display_name ?? s.name ?? s.id_service).replace(/_/g, " ");
}

const ServiceSelectModal: FC<ServiceSelectModalProps> = ({ open, onClose, onConfirm }) => {
  const [services, setServices] = useState<ServiceEntity[]>([]);
  const [portals, setPortals] = useState<PortalOption[]>([]);
  const [magazines, setMagazines] = useState<MagazineOption[]>([]);
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [selectedPortalId, setSelectedPortalId] = useState<number | null>(null);
  const [selectedMagazineId, setSelectedMagazineId] = useState<string>("");
  const [serviceNameFilter, setServiceNameFilter] = useState("");
  const [selected, setSelected] = useState<ServiceRow | null>(null);
  const [publicationMonth, setPublicationMonth] = useState<number>(new Date().getMonth() + 1);
  const [publicationYear, setPublicationYear] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [magazinePageType, setMagazinePageType] = useState<string>("");
  const [magazineSlotKey, setMagazineSlotKey] = useState<string>("");
  const [magazinePublications, setMagazinePublications] = useState<PublicationEditionRow[]>([]);
  const [magazinePublicationsLoading, setMagazinePublicationsLoading] = useState(false);
  const [magazinePublicationsFilter, setMagazinePublicationsFilter] = useState("");
  const [selectedMagazinePublicationId, setSelectedMagazinePublicationId] = useState<string>("");
  const [magazinePickMeta, setMagazinePickMeta] = useState<Omit<MagazinePickerSelection, "service"> | null>(null);
  const [lineDraft, setLineDraft] = useState<ServiceLineDraft>({
    description: "",
    specifications: "",
    units: 1,
    unit_price: 0,
    discount_pct: 0,
  });

  const initLineDraftFromService = (service: ServiceRow) => {
    const description = String(
      (service as { service_description?: string }).service_description ?? service.description ?? ""
    ).trim();
    const specifications = String(service.service_unit_specifications ?? "").trim();
    setLineDraft({
      description,
      specifications,
      units: 1,
      unit_price: Number(service.tariff_price_eur) || 0,
      discount_pct: 0,
    });
  };

  useEffect(() => {
    if (!open) return;
    setPhase(1);
    setSelectedChannel("");
    setSelectedPortalId(null);
    setSelectedMagazineId("");
    setSelected(null);
    setServiceNameFilter("");
    setPublicationMonth(new Date().getMonth() + 1);
    setPublicationYear(new Date().getFullYear());
    setStartDate("");
    setEndDate("");
    setMagazinePageType("");
    setMagazineSlotKey("");
    setMagazinePublications([]);
    setMagazinePublicationsLoading(false);
    setMagazinePublicationsFilter("");
    setSelectedMagazinePublicationId("");
    setMagazinePickMeta(null);
    setLineDraft({ description: "", specifications: "", units: 1, unit_price: 0, discount_pct: 0 });
    Promise.all([
      ServiceService.getAllServices().then((list) => (Array.isArray(list) ? list : [])).catch(() => []),
      PortalService.getAllPortals().then((list) => (Array.isArray(list) ? list : [])).catch(() => []),
      MagazineService.getAllMagazines().then((list) => (Array.isArray(list) ? list : [])).catch(() => []),
    ]).then(([svcList, portalList, magazineList]) => {
      setServices(svcList as ServiceEntity[]);
      setPortals((portalList as PortalOption[]).filter((p) => p && typeof p.id === "number"));
      setMagazines((magazineList as MagazineOption[]).filter((m) => m && typeof m.id_magazine === "string"));
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!selectedMagazineId) {
      setMagazinePublications([]);
      setSelectedMagazinePublicationId("");
    setMagazinePickMeta(null);
      setMagazinePublicationsFilter("");
      return;
    }
    setMagazinePublicationsLoading(true);
    PublicationService.listPublicationsForMagazine(selectedMagazineId)
      .then((list: unknown[]) => {
        const rows = Array.isArray(list) ? list : [];
        const normalized: PublicationEditionRow[] = rows
          .filter((r): r is Record<string, unknown> => r !== null && typeof r === "object")
          .map((o) => ({
            id_publication: String(o.id_publication ?? o.publication_id ?? o.id ?? "").trim(),
            edition_name: o.edition_name != null ? String(o.edition_name) : undefined,
            publication_edition_name:
              o.publication_edition_name != null ? String(o.publication_edition_name) : undefined,
            publication_date: o.publication_date != null ? String(o.publication_date) : undefined,
            real_publication_month_date:
              o.real_publication_month_date != null ? String(o.real_publication_month_date) : undefined,
            theme: o.theme != null ? String(o.theme) : undefined,
            year: typeof o.year === "number" ? o.year : undefined,
            issue_number: typeof o.issue_number === "number" ? o.issue_number : undefined,
          }))
          .filter((p) => p.id_publication.length > 0);
        setMagazinePublications(normalized);
        setSelectedMagazinePublicationId("");
    setMagazinePickMeta(null);
      })
      .catch(() => {
        setMagazinePublications([]);
        setSelectedMagazinePublicationId("");
    setMagazinePickMeta(null);
      })
      .finally(() => setMagazinePublicationsLoading(false));
  }, [open, selectedMagazineId]);

  const selectedServiceName = selected?.name ?? selected?.id_service ?? "";

  const channels = useMemo(() => {
    const set = new Set<string>();
    for (const s of services) {
      const ch = serviceChannel(s);
      if (ch) set.add(ch);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [services]);

  const filteredServicesForChannel = useMemo(() => {
    if (!selectedChannel) return [];
    const ch = selectedChannel.toLowerCase();
    const q = serviceNameFilter.trim().toLowerCase();
    let list = services.filter((s) => serviceChannel(s) === ch);
    list.sort((a, b) => {
      const specDiff =
        specifitySortKey(String((a as { specifity?: string }).specifity ?? "general")) -
        specifitySortKey(String((b as { specifity?: string }).specifity ?? "general"));
      if (specDiff !== 0) return specDiff;
      return serviceLabel(a).localeCompare(serviceLabel(b));
    });
    if (q) {
      list = list.filter((s) => {
        const label = serviceLabel(s).toLowerCase();
        const id = String(s.id_service ?? "").toLowerCase();
        return label.includes(q) || id.includes(q);
      });
    }
    return list;
  }, [services, selectedChannel, serviceNameFilter]);

  const isQuarterlyService = selectedServiceName === "portal_banner" || selectedServiceName === "portal_premium_profile";
  const isMagazineService = String(selectedChannel ?? "").toLowerCase() === "magazine";
  const isMagazineAdvert = isMagazineService && isMagazineAdvertService(selectedServiceName);
  const tariffQuarterly = selected?.tariff_price_eur ?? 0;
  const months = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return monthsBetween(startDate, endDate);
  }, [startDate, endDate]);
  const calculatedPrice = useMemo(() => {
    if (!isQuarterlyService || months <= 0) return tariffQuarterly;
    return Math.round(tariffQuarterly * (months / 3) * 100) / 100;
  }, [isQuarterlyService, months, tariffQuarterly]);

  const isMagazineChannel = String(selectedChannel ?? "").toLowerCase() === "magazine";

  const canConfirm = useMemo(() => {
    if (!selected) return false;
    if (isMagazineChannel && magazinePickMeta) {
      if (isPreferentialCatalogKey(magazinePickMeta.catalogKey)) {
        return (
          !!magazinePickMeta.preferential_slot_id &&
          !!magazinePickMeta.position_in_magazine &&
          lineDraft.units > 0
        );
      }
      return !!magazinePickMeta.publicationId && lineDraft.units > 0;
    }
    switch (selectedServiceName) {
      case "newsletter":
        return publicationMonth >= 1 && publicationMonth <= 12 && publicationYear >= 2020 && publicationYear <= 2030;
      case "portal_article":
        return true;
      case "portal_banner":
      case "portal_premium_profile":
        return !!startDate && !!endDate && new Date(endDate) >= new Date(startDate);
      case "magazine_article":
        return !!selectedMagazineId && !!selectedMagazinePublicationId;
      case "magazine_advertisement":
        return !!selectedMagazineId && !!selectedMagazinePublicationId && !!magazinePageType && !!magazineSlotKey;
      default:
        if (isMagazineService) {
          if (!selectedMagazineId || !selectedMagazinePublicationId) return false;
          if (isMagazineAdvert && (!magazinePageType || !magazineSlotKey)) return false;
          return true;
        }
        if (selectedChannel.toLowerCase() === "dem") {
          return publicationMonth >= 1 && publicationMonth <= 12 && publicationYear >= 2020 && publicationYear <= 2030;
        }
        return true;
    }
  }, [
    selected,
    selectedServiceName,
    selectedChannel,
    publicationMonth,
    publicationYear,
    startDate,
    endDate,
    selectedMagazineId,
    selectedMagazinePublicationId,
    magazinePageType,
    magazineSlotKey,
    isMagazineService,
    isMagazineAdvert,
    magazinePickMeta,
    isMagazineChannel,
    lineDraft.units,
  ]);

  const filteredMagazinePublications = useMemo(() => {
    const q = magazinePublicationsFilter.trim().toLowerCase();
    if (!q) return magazinePublications;
    return magazinePublications.filter((p) => {
      const blob =
        `${p.id_publication} ${publicationEditionLabel(p)} ${p.publication_date ?? ""} ${p.real_publication_month_date ?? ""} ${
          p.theme ?? ""
        }`.toLowerCase();
      return blob.includes(q);
    });
  }, [magazinePublications, magazinePublicationsFilter]);

  const resetSpecificities = () => {
    setPublicationMonth(new Date().getMonth() + 1);
    setPublicationYear(new Date().getFullYear());
    setStartDate("");
    setEndDate("");
    setMagazinePageType("");
    setMagazineSlotKey("");
    setMagazinePublications([]);
    setMagazinePublicationsLoading(false);
    setMagazinePublicationsFilter("");
    setSelectedMagazinePublicationId("");
    setMagazinePickMeta(null);
    setSelectedPortalId(null);
    setSelectedMagazineId("");
    setMagazinePickMeta(null);
    setLineDraft({ description: "", specifications: "", units: 1, unit_price: 0, discount_pct: 0 });
  };

  const handleMagazinePickerSelect = (sel: MagazinePickerSelection) => {
    setSelected(sel.service);
    initLineDraftFromService(sel.service);
    setSelectedMagazinePublicationId(sel.publicationId);
    setMagazinePickMeta({
      publicationId: sel.publicationId,
      publicationLabel: sel.publicationLabel,
      publicationDateIso: sel.publicationDateIso,
      preferential_slot_id: sel.preferential_slot_id,
      position_in_magazine: sel.position_in_magazine,
      catalogKey: sel.catalogKey,
    });
    setPhase(3);
  };

  const handleSelectService = (s: ServiceEntity) => {
    setSelected(s);
    resetSpecificities();
    initLineDraftFromService(s);
    setPhase(3);
  };

  const handleConfirm = () => {
    if (!selected || !canConfirm) return;
    let extra: ServiceExtra | undefined;
    const selectedPublication = magazinePublications.find((p) => p.id_publication === selectedMagazinePublicationId);
    const publicationDateIso = (() => {
      if (magazinePickMeta?.publicationDateIso) return magazinePickMeta.publicationDateIso;
      const raw = selectedPublication?.real_publication_month_date ?? selectedPublication?.publication_date;
      if (!raw) return undefined;
      const str = String(raw).trim();
      if (!str) return undefined;
      return str.length >= 10 ? str.slice(0, 10) : str;
    })();

    if (isMagazineChannel && magazinePickMeta) {
      const pubLabel = magazinePickMeta.publicationLabel;
      const pubId = magazinePickMeta.publicationId;
      const catalogKey = magazinePickMeta.catalogKey;
      const placement = deriveMagazinePageTypeAndSlotKey(catalogKey, magazinePickMeta.position_in_magazine);

      if (isPreferentialCatalogKey(catalogKey)) {
        extra = {
          type: "magazine_preferential",
          id_planned_publication: pubId,
          publicationLabel: pubLabel,
          publicationDateIso,
          preferential_slot_id: magazinePickMeta.preferential_slot_id!,
          position_in_magazine: magazinePickMeta.position_in_magazine!,
          ...(placement ? { pageType: placement.pageType, slotKey: placement.slotKey } : {}),
        };
      } else if (catalogKey === "single_advert" || catalogKey === "double_advert") {
        extra = {
          type: "magazine_advertisement",
          id_planned_publication: pubId,
          publicationLabel: pubLabel,
          publicationDateIso,
          pageType: placement?.pageType ?? "",
          slotKey: placement?.slotKey ?? "",
        };
      } else {
        extra = {
          type: "magazine_article",
          id_planned_publication: pubId,
          publicationLabel: pubLabel,
          publicationDateIso,
        };
      }
    } else {
    switch (selectedServiceName) {
      case "newsletter":
        extra = { type: "newsletter", publicationMonth, publicationYear };
        break;
      case "portal_article":
        extra = { type: "portal_article" };
        break;
      case "portal_banner":
        extra = { type: "portal_banner", startDate, endDate, calculatedPrice };
        break;
      case "portal_premium_profile":
        extra = { type: "portal_premium_profile", startDate, endDate, calculatedPrice };
        break;
      case "magazine_article":
        extra = {
          type: "magazine_article",
          id_planned_publication: selectedMagazinePublicationId,
          publicationLabel: selectedPublication ? publicationEditionLabel(selectedPublication) : selectedMagazinePublicationId,
          publicationDateIso,
        };
        break;
      case "magazine_advertisement":
        extra = {
          type: "magazine_advertisement",
          id_planned_publication: selectedMagazinePublicationId,
          publicationLabel: selectedPublication ? publicationEditionLabel(selectedPublication) : selectedMagazinePublicationId,
          pageType: magazinePageType,
          slotKey: magazineSlotKey,
          publicationDateIso,
        };
        break;
      default:
        if (isMagazineService) {
          extra = isMagazineAdvert
            ? {
                type: "magazine_advertisement",
                id_planned_publication: selectedMagazinePublicationId,
                publicationLabel: selectedPublication ? publicationEditionLabel(selectedPublication) : selectedMagazinePublicationId,
                pageType: magazinePageType,
                slotKey: magazineSlotKey,
                publicationDateIso,
              }
            : {
                type: "magazine_article",
                id_planned_publication: selectedMagazinePublicationId,
                publicationLabel: selectedPublication ? publicationEditionLabel(selectedPublication) : selectedMagazinePublicationId,
                publicationDateIso,
              };
        } else if (selectedChannel.toLowerCase() === "dem") {
          extra = { type: "newsletter", publicationMonth, publicationYear };
        }
        break;
    }
    }
    const price =
      isMagazineChannel && magazinePickMeta
        ? lineDraft.unit_price
        : extra && "calculatedPrice" in extra
          ? extra.calculatedPrice
          : selected.tariff_price_eur;
    const confirmLineDraft = isMagazineChannel && magazinePickMeta ? lineDraft : undefined;
    onConfirm({ ...selected, tariff_price_eur: price }, extra, confirmLineDraft);
    setSelected(null);
    resetSpecificities();
    onClose();
  };

  const handleClose = () => {
    setSelected(null);
    setPhase(1);
    setSelectedChannel("");
    setServiceNameFilter("");
    resetSpecificities();
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleSelectPage = (pageType: string, slotKey: string, available: boolean) => {
    if (!available) return;
    setMagazinePageType(pageType);
    setMagazineSlotKey(slotKey);
  };

  if (!open) return null;

  const specifityBadge = (s: ServiceEntity) => {
    const spec = String((s as { specifity?: string }).specifity ?? "general");
    if (spec === "specific-related") return "Specific";
    return "General";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Select service</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {phase === 1
                ? "Phase 1: choose channel."
                : phase === 2
                  ? isMagazineChannel
                    ? "Phase 2: choose magazine, edition, and service."
                    : "Phase 2: choose a service."
                  : "Phase 3: configure specificities."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span className={`px-2 py-1 rounded-full ${phase === 1 ? "bg-blue-100 text-blue-800" : "bg-gray-100"}`}>
              1 · Channel
            </span>
            <span className={`px-2 py-1 rounded-full ${phase === 2 ? "bg-blue-100 text-blue-800" : "bg-gray-100"}`}>
              2 · Service
            </span>
            <span className={`px-2 py-1 rounded-full ${phase === 3 ? "bg-blue-100 text-blue-800" : "bg-gray-100"}`}>
              3 · Specificities
            </span>
            {selectedChannel && (
              <span className="ml-2 text-gray-500">
                Channel: <span className="font-medium text-gray-800">{channelLabel(selectedChannel)}</span>
              </span>
            )}
            {selected && phase === 3 && (
              <span className="ml-2 text-gray-500">
                Service: <span className="font-medium text-gray-800">{serviceLabel(selected)}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4 space-y-4">
          {phase === 1 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {channels.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => {
                      setSelectedChannel(ch);
                      setSelected(null);
                      setServiceNameFilter("");
                      setPhase(2);
                    }}
                    className="rounded-lg border-2 border-gray-200 px-4 py-4 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="font-semibold text-gray-900">{channelLabel(ch)}</div>
                    <div className="text-xs text-gray-500 mt-1 font-mono">{String(ch)}</div>
                  </button>
                ))}
              </div>
              {channels.length === 0 && (
                <p className="text-sm text-gray-500 py-2">No channels found. Check services catalog.</p>
              )}
            </>
          )}

          {phase === 2 && isMagazineChannel && (
            <MagazineServicePickerPhase
              magazines={magazines}
              services={services}
              onBack={() => {
                setPhase(1);
                setSelectedChannel("");
                setSelected(null);
                setMagazinePickMeta(null);
              }}
              onSelect={handleMagazinePickerSelect}
            />
          )}

          {phase === 2 && !isMagazineChannel && (
            <>
              <button
                type="button"
                onClick={() => {
                  setPhase(1);
                  setSelectedChannel("");
                  setSelected(null);
                  setServiceNameFilter("");
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                ← Back to channels
              </button>
              <div>
                <label htmlFor="svc-filter" className="block text-xs font-medium text-gray-600 mb-1">
                  Filter services by name
                </label>
                <input
                  id="svc-filter"
                  type="text"
                  value={serviceNameFilter}
                  onChange={(e) => setServiceNameFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Service name or id…"
                />
              </div>
              {filteredServicesForChannel.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">No services match this channel and filter.</p>
              ) : (
                <ul className="space-y-2">
                  {filteredServicesForChannel.map((s) => (
                    <li key={s.id_service}>
                      <button
                        type="button"
                        onClick={() => handleSelectService(s)}
                        className="w-full text-left rounded-lg border-2 border-gray-200 px-4 py-3 hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-medium text-gray-900">{serviceLabel(s)}</span>
                          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            {s.name === "portal_banner" || s.name === "portal_premium_profile"
                              ? `${s.tariff_price_eur} €/trim.`
                              : `${s.tariff_price_eur} €`}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {specifityBadge(s)}
                          </span>
                          <span className="text-xs text-gray-500 font-mono">{s.id_service}</span>
                        </div>
                        {s.unit && <p className="text-xs text-gray-500 mt-0.5">Unit: {s.unit}</p>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {phase === 3 && selected && (
            <>
              <button
                type="button"
                onClick={() => {
                  setPhase(2);
                  setSelected(null);
                  if (isMagazineChannel) setMagazinePickMeta(null);
                  else resetSpecificities();
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                ← Back to services
              </button>

              <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Selected service</p>
                <p className="font-semibold text-gray-900 mt-1">{serviceLabel(selected)}</p>
                {!magazinePickMeta && (
                  <p className="text-sm text-gray-600 mt-1">{selected.tariff_price_eur} €</p>
                )}
              </div>

              <div className="space-y-4">
                {isMagazineChannel && magazinePickMeta && (
                  <>
                    <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-gray-800 space-y-1">
                      <p>
                        <span className="text-gray-500">Edition:</span> {magazinePickMeta.publicationLabel}
                      </p>
                      <p className="font-mono text-xs text-gray-600">{magazinePickMeta.publicationId}</p>
                      {magazinePickMeta.position_in_magazine && (
                        <p>
                          <span className="text-gray-500">Placement:</span> {magazinePickMeta.position_in_magazine}
                        </p>
                      )}
                    </div>
                    <ServiceLineConfirmFields
                      draft={lineDraft}
                      onChange={(patch) => setLineDraft((prev) => ({ ...prev, ...patch }))}
                    />
                  </>
                )}

                {!magazinePickMeta && (selectedServiceName === "newsletter" || selectedChannel.toLowerCase() === "dem") && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Publication month</label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={publicationMonth}
                        onChange={(e) => setPublicationMonth(Number(e.target.value))}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Publication year</label>
                      <input
                        type="number"
                        min={2020}
                        max={2030}
                        value={publicationYear}
                        onChange={(e) => setPublicationYear(Number(e.target.value))}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {!magazinePickMeta &&
                  (selectedServiceName === "portal_banner" || selectedServiceName === "portal_premium_profile") && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Start date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">End date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    {startDate && endDate && (
                      <p className="text-sm text-gray-700">
                        Proportional quarterly price: <strong>{calculatedPrice.toFixed(2)} €</strong> ({months.toFixed(1)}{" "}
                        months)
                      </p>
                    )}
                  </div>
                )}

                {!magazinePickMeta &&
                  (selectedServiceName === "magazine_article" ||
                    selectedServiceName === "magazine_advertisement" ||
                    isMagazineService) && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Magazine</label>
                      <select
                        value={selectedMagazineId}
                        onChange={(e) => {
                          setSelectedMagazineId(e.target.value);
                          setSelectedMagazinePublicationId("");
    setMagazinePickMeta(null);
                        }}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg"
                      >
                        <option value="">Select magazine</option>
                        {magazines.map((m) => (
                          <option key={m.id_magazine} value={m.id_magazine}>
                            {m.name || m.id_magazine}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedMagazineId && (
                      <div className="space-y-2">
                        <label className="block text-xs text-gray-600 mb-1">Publication</label>
                        <input
                          type="text"
                          value={magazinePublicationsFilter}
                          onChange={(e) => setMagazinePublicationsFilter(e.target.value)}
                          placeholder="Filter publications by name, date or id…"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        />
                        {magazinePublicationsLoading ? (
                          <p className="text-sm text-gray-500">Loading publications…</p>
                        ) : magazinePublications.length === 0 ? (
                          <p className="text-sm text-gray-500">No publications found for this magazine.</p>
                        ) : (
                          <div className="w-full overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="w-12 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Pick
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Edition</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {filteredMagazinePublications.map((p) => {
                                  const checked = selectedMagazinePublicationId === p.id_publication;
                                  return (
                                    <tr key={p.id_publication} className={checked ? "bg-blue-50" : "hover:bg-gray-50"}>
                                      <td className="px-3 py-2 align-middle">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() => setSelectedMagazinePublicationId(checked ? "" : p.id_publication)}
                                          className="rounded border-gray-300"
                                          aria-label={`Select publication ${p.id_publication}`}
                                        />
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-900">{publicationEditionLabel(p)}</td>
                                      <td className="px-4 py-2 text-sm text-gray-600">{p.publication_date || "—"}</td>
                                      <td className="px-4 py-2 text-xs font-mono text-gray-500">{p.id_publication}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {isMagazineAdvert && selectedMagazinePublicationId && !magazinePickMeta && (
                  <ServiceAdvertPageTypeList
                    magazinePageType={magazinePageType}
                    magazineSlotKey={magazineSlotKey}
                    onSelectPage={handleSelectPage}
                  />
                )}

                {selectedServiceName === "portal_article" && (
                  <p className="text-sm text-gray-600">No additional specificities required for this service.</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={phase !== 3 || !selected || !canConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceSelectModal;
