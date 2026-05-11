"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import { ServiceService } from "@/app/service/ServiceService";
import { ServiceGroupService } from "@/app/service/ServiceGroupService";
import { PortalService } from "@/app/service/PortalService";
import { MagazineService } from "@/app/service/MagazineService";
import { PublicationService } from "@/app/service/PublicationService";


import type {
  MagazineOption,
  PortalOption,
  PublicationEditionRow,
  ServiceEntity,
  ServiceExtra,
  ServiceGroupRow,
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

export type { ServiceRow, ServiceExtra } from "./modal_service_select_components/types";

const ServiceSelectModal: FC<ServiceSelectModalProps> = ({ open, onClose, onConfirm }) => {
  const [services, setServices] = useState<ServiceEntity[]>([]);
  const [serviceGroups, setServiceGroups] = useState<ServiceGroupRow[]>([]);
  const [portals, setPortals] = useState<PortalOption[]>([]);
  const [magazines, setMagazines] = useState<MagazineOption[]>([]);
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedPortalId, setSelectedPortalId] = useState<number | null>(null);
  const [selectedMagazineId, setSelectedMagazineId] = useState<string>("");
  const [groupNameFilter, setGroupNameFilter] = useState("");
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

  useEffect(() => {
    if (!open) return;
    setPhase(1);
    setSelectedChannel("");
    setSelectedGroupId(null);
    setSelectedPortalId(null);
    setSelectedMagazineId("");
    setSelected(null);
    setGroupNameFilter("");
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
    Promise.all([
      ServiceService.getAllServices().then((list) => (Array.isArray(list) ? list : [])).catch(() => []),
      ServiceGroupService.getAllServiceGroups().then((list) => (Array.isArray(list) ? list : [])).catch(() => []),
      PortalService.getAllPortals().then((list) => (Array.isArray(list) ? list : [])).catch(() => []),
      MagazineService.getAllMagazines().then((list) => (Array.isArray(list) ? list : [])).catch(() => []),
    ]).then(([svcList, grpList, portalList, magazineList]) => {
      setServices(svcList as ServiceEntity[]);
      setServiceGroups(grpList as ServiceGroupRow[]);
      setPortals((portalList as PortalOption[]).filter((p) => p && typeof p.id === "number"));
      setMagazines((magazineList as MagazineOption[]).filter((m) => m && typeof m.id_magazine === "string"));
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!selectedMagazineId) {
      setMagazinePublications([]);
      setSelectedMagazinePublicationId("");
      setMagazinePublicationsFilter("");
      return;
    }
    setMagazinePublicationsLoading(true);
    PublicationService.listPublicationsForMagazine(selectedMagazineId)
      .then((list: any[]) => {
        const rows = Array.isArray(list) ? list : [];
        const normalized: PublicationEditionRow[] = rows
          .filter((r) => r && typeof r === "object")
          .map((r) => {
            const o = r as any;
            return {
              id_publication: String(o.id_publication ?? o.publication_id ?? o.id ?? "").trim(),
              edition_name: o.edition_name != null ? String(o.edition_name) : undefined,
              publication_edition_name: o.publication_edition_name != null ? String(o.publication_edition_name) : undefined,
              publication_date: o.publication_date != null ? String(o.publication_date) : undefined,
              real_publication_month_date:
                o.real_publication_month_date != null ? String(o.real_publication_month_date) : undefined,
              theme: o.theme != null ? String(o.theme) : undefined,
              year: typeof o.year === "number" ? o.year : undefined,
              issue_number: typeof o.issue_number === "number" ? o.issue_number : undefined,
            };
          })
          .filter((p) => p.id_publication.length > 0);
        setMagazinePublications(normalized);
        setSelectedMagazinePublicationId("");
      })
      .catch(() => {
        setMagazinePublications([]);
        setSelectedMagazinePublicationId("");
      })
      .finally(() => setMagazinePublicationsLoading(false));
  }, [open, selectedMagazineId]);

  const selectedServiceName = selected?.name ?? selected?.id_service ?? "";

  const groupIdsWithServices = useMemo(() => {
    const ids = new Set<string>();
    for (const s of services) {
      const gid = String(s.service_group_id ?? "").trim();
      if (gid) ids.add(gid);
    }
    return ids;
  }, [services]);

  const filteredGroups = useMemo(() => {
    const q = groupNameFilter.trim().toLowerCase();
    const ungroupedCount = services.filter((s) => !String(s.service_group_id ?? "").trim()).length;
    const synthetic: ServiceGroupRow[] =
      ungroupedCount > 0
        ? [
            {
              service_group_id: "__ungrouped__",
              service_group_name: "Other (no service group)",
              service_group_channel: "",
            },
          ]
        : [];
    let list = [
      ...synthetic,
      ...serviceGroups.filter((g) => groupIdsWithServices.has(g.service_group_id)),
    ];
    if (selectedChannel) {
      const ch = selectedChannel.toLowerCase();
      list = list.filter((g) => {
        const gch = String(g.service_group_channel ?? "").toLowerCase();
        if (g.service_group_id === "__ungrouped__") return false;
        return gch === ch;
      });
    }
    if (q) {
      list = list.filter((g) => {
        const name = (g.service_group_name ?? "").toLowerCase();
        const shown = String(g.shown_name ?? "").toLowerCase();
        const id = (g.service_group_id ?? "").toLowerCase();
        const ch = (g.service_group_channel ?? "").toLowerCase();
        return name.includes(q) || shown.includes(q) || id.includes(q) || ch.includes(q);
      });
    }
    return list;
  }, [serviceGroups, groupIdsWithServices, groupNameFilter, services, selectedChannel]);

  const servicesInSelectedGroup = useMemo(() => {
    if (!selectedGroupId) return [];
    const q = serviceNameFilter.trim().toLowerCase();
    let list =
      selectedGroupId === "__ungrouped__"
        ? services.filter((s) => !String(s.service_group_id ?? "").trim())
        : services.filter((s) => String(s.service_group_id ?? "") === selectedGroupId);
    // Phase 3 filter: portal/magazine
    if (selectedChannel && (selectedChannel.toLowerCase() === "portal" || selectedChannel.toLowerCase() === "dem")) {
      if (selectedPortalId != null) {
        list = list.filter((s) => Number(s.service_portal ?? -1) === selectedPortalId);
      } else {
        list = [];
      }
    }
    if (selectedChannel && selectedChannel.toLowerCase() === "magazine") {
      if (selectedMagazineId) {
        const mid = selectedMagazineId.trim();
        const re = new RegExp(`\\bmagazine\\s+${mid.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\b`, "i");
        list = list.filter((s) => re.test(String(s.name ?? "")) || re.test(String(s.display_name ?? "")));
      } else {
        list = [];
      }
    }
    if (q) {
      list = list.filter((s) => {
        const label = String(s.display_name ?? s.name ?? "").toLowerCase();
        const shown = String(s.shown_name ?? "").toLowerCase();
        const id = String(s.id_service ?? "").toLowerCase();
        return label.includes(q) || shown.includes(q) || id.includes(q);
      });
    }
    return list;
  }, [services, selectedGroupId, serviceNameFilter, selectedChannel, selectedPortalId, selectedMagazineId]);

  const selectedGroup = useMemo(
    () => serviceGroups.find((g) => g.service_group_id === selectedGroupId) ?? null,
    [serviceGroups, selectedGroupId]
  );

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
    return Math.round((tariffQuarterly * (months / 3)) * 100) / 100;
  }, [isQuarterlyService, months, tariffQuarterly]);

  const canConfirm = useMemo(() => {
    if (!selected) return false;
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
        return true;
    }
  }, [
    selected,
    selectedServiceName,
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

  const handleConfirm = () => {
    if (!selected || !canConfirm) return;
    let extra: ServiceExtra | undefined;
    const selectedPublication = magazinePublications.find((p) => p.id_publication === selectedMagazinePublicationId);
    const publicationDateIso = (() => {
      const raw = selectedPublication?.real_publication_month_date ?? selectedPublication?.publication_date;
      if (!raw) return undefined;
      const s = String(raw).trim();
      if (!s) return undefined;
      // publication_date may already be YYYY-MM-DD; if it's ISO with time, slice.
      return s.length >= 10 ? s.slice(0, 10) : s;
    })();
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
        }
        break;
    }
    const price = extra && "calculatedPrice" in extra ? extra.calculatedPrice : selected.tariff_price_eur;
    onConfirm({ ...selected, tariff_price_eur: price }, extra);
    setSelected(null);
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
    onClose();
  };

  const handleClose = () => {
    setSelected(null);
    setPhase(1);
    setSelectedChannel("");
    setSelectedGroupId(null);
    setSelectedPortalId(null);
    setSelectedMagazineId("");
    setGroupNameFilter("");
    setServiceNameFilter("");
    setMagazinePageType("");
    setMagazineSlotKey("");
    setMagazinePublications([]);
    setMagazinePublicationsLoading(false);
    setMagazinePublicationsFilter("");
    setSelectedMagazinePublicationId("");
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleSelectPage = (pageType: string, slotKey: string, available: boolean) => {
    if (!available) return;
    setMagazinePageType(pageType);
    setMagazineSlotKey(slotKey);
  };

  const channels = useMemo(() => {
    const set = new Set<string>();
    serviceGroups.forEach((g) => {
      const c = String(g.service_group_channel ?? "").trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [serviceGroups]);

  if (!open) return null;

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
                  ? "Phase 2: choose a service group (filtered by channel)."
                  : selectedChannel.toLowerCase() === "magazine"
                    ? "Phase 3: choose magazine, then pick a service."
                    : "Phase 3: choose portal, then pick a service."}
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
            <span className={`px-2 py-1 rounded-full ${phase === 1 ? "bg-blue-100 text-blue-800" : "bg-gray-100"}`}>1 · Channel</span>
            <span className={`px-2 py-1 rounded-full ${phase === 2 ? "bg-blue-100 text-blue-800" : "bg-gray-100"}`}>2 · Group</span>
            <span className={`px-2 py-1 rounded-full ${phase === 3 ? "bg-blue-100 text-blue-800" : "bg-gray-100"}`}>3 · Portal/Magazine + Service</span>
            {selectedChannel && (
              <span className="ml-2 text-gray-500">
                Selected channel: <span className="font-medium text-gray-800">{channelLabel(selectedChannel)}</span>
              </span>
            )}
            {selectedGroupId && phase >= 2 && (
              <span className="ml-2 text-gray-500">
                Group:{" "}
                <span className="font-medium text-gray-800">
                  {selectedGroup?.shown_name || selectedGroup?.service_group_name || selectedGroupId}
                </span>
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4 space-y-4">
          {phase === 1 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {channels.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => {
                      setSelectedChannel(ch);
                      setSelectedGroupId(null);
                      setSelected(null);
                      setSelectedPortalId(null);
                      setSelectedMagazineId("");
                      setGroupNameFilter("");
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
                <p className="text-sm text-gray-500 py-2">No channels found. Check service groups.</p>
              )}
            </>
          ) : phase === 2 ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setPhase(1);
                  setSelectedChannel("");
                  setSelectedGroupId(null);
                  setSelected(null);
                  setSelectedPortalId(null);
                  setSelectedMagazineId("");
                  setGroupNameFilter("");
                  setServiceNameFilter("");
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                ← Back to channels
              </button>
              <div>
                <label htmlFor="sgroup-filter" className="block text-xs font-medium text-gray-600 mb-1">
                  Filter groups by name
                </label>
                <input
                  id="sgroup-filter"
                  type="text"
                  value={groupNameFilter}
                  onChange={(e) => setGroupNameFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Group name, id, or channel…"
                />
              </div>
              {filteredGroups.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">No service groups match your filter.</p>
              ) : (
                <ul className="space-y-2">
                  {filteredGroups.map((g) => (
                    <li key={g.service_group_id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGroupId(g.service_group_id);
                          setSelected(null);
                          setSelectedPortalId(null);
                          setSelectedMagazineId("");
                          setServiceNameFilter("");
                          setPhase(3);
                        }}
                        className="w-full text-left rounded-lg border-2 border-gray-200 px-4 py-3 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-medium text-gray-900">
                            {g.shown_name || g.service_group_name}
                          </span>
                          {g.service_group_id !== "__ungrouped__" && (
                            <span className="text-xs font-semibold text-gray-500 shrink-0">
                              {channelLabel(g.service_group_channel)}
                            </span>
                          )}
                        </div>
                        {g.service_group_id !== "__ungrouped__" && (
                          <p className="text-xs text-gray-500 mt-1 font-mono">{g.service_group_id}</p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setPhase(2);
                  setSelectedGroupId(null);
                  setSelected(null);
                  setSelectedPortalId(null);
                  setSelectedMagazineId("");
                  setServiceNameFilter("");
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                ← Back to service groups
              </button>
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm">
                <span className="text-gray-500">Group: </span>
                <span className="font-medium text-gray-900">
                  {selectedGroup?.shown_name || selectedGroup?.service_group_name || selectedGroupId}
                </span>
              </div>

              {(selectedChannel.toLowerCase() === "portal" || selectedChannel.toLowerCase() === "dem") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Portal</label>
                    <select
                      value={selectedPortalId != null ? String(selectedPortalId) : ""}
                      onChange={(e) => {
                        const v = e.target.value ? Number(e.target.value) : NaN;
                        setSelectedPortalId(Number.isFinite(v) ? v : null);
                        setSelected(null);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select portal</option>
                      {portals.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.key})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {selectedChannel.toLowerCase() === "magazine" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Magazine</label>
                    <select
                      value={selectedMagazineId}
                      onChange={(e) => {
                        setSelectedMagazineId(e.target.value);
                        setSelected(null);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select magazine</option>
                      {magazines.map((m) => (
                        <option key={m.id_magazine} value={m.id_magazine}>
                          {m.name} ({m.id_magazine})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

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
              {servicesInSelectedGroup.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">
                  {selectedChannel.toLowerCase() === "magazine" && !selectedMagazineId
                    ? "Select a magazine to see services."
                    : (selectedChannel.toLowerCase() === "portal" || selectedChannel.toLowerCase() === "dem") && selectedPortalId == null
                      ? "Select a portal to see services."
                      : "No services in this group match your filter."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {servicesInSelectedGroup.map((s) => {
              const isSelected = selected?.id_service === s.id_service;
              const sname = s.name ?? s.id_service ?? "";
              return (
                <li key={s.id_service}>
                  <div
                    className={`rounded-lg border-2 transition-colors ${
                      isSelected ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(s);
                        setStartDate("");
                        setEndDate("");
                        setMagazinePageType("");
                        setMagazineSlotKey("");
                        setMagazinePublications([]);
                        setMagazinePublicationsLoading(false);
                        setMagazinePublicationsFilter("");
                        setSelectedMagazinePublicationId("");
                      }}
                      className="w-full text-left px-4 py-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-medium text-gray-900">
                          {String(s.shown_name ?? "").trim()
                            ? String(s.shown_name)
                            : String(s.display_name ?? s.name).replace(/_/g, " ")}
                        </span>
                        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                          {s.name === "portal_banner" || s.name === "portal_premium_profile" ? `${s.tariff_price_eur} €/trim.` : `${s.tariff_price_eur} €`}
                        </span>
                      </div>
                      {s.unit && <p className="text-xs text-gray-500 mt-0.5">Unit: {s.unit}</p>}
                    </button>

                    {isSelected && sname !== "portal_article" && (
                      <div className="px-4 pt-4 pb-4 space-y-4 border-t border-gray-200/80">
                        {/* Newsletter: publication month & year */}
                        {sname === "newsletter" && (
                          <div className="grid grid-cols-2 gap-3 pt-3">
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

                        {/* Portal banner / Premium: start & end date, proportional price */}
                        {(sname === "portal_banner" || sname === "portal_premium_profile") && (
                          <div className="space-y-3 pt-3">
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
                                Proportional quarterly price: <strong>{calculatedPrice.toFixed(2)} €</strong> ({months.toFixed(1)} months)
                              </p>
                            )}
                          </div>
                        )}

                        {/* Magazine services: publication from publications_db */}
                        {(sname === "magazine_article" || isMagazineService) && (
                          <div className="space-y-3 pt-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Magazine</label>
                              <select
                                value={selectedMagazineId}
                                onChange={(e) => {
                                  setSelectedMagazineId(e.target.value);
                                  setSelectedMagazinePublicationId("");
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
                                <label className="block text-xs text-gray-600 mb-1">Publication (publications_db)</label>
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
                                  <p className="text-sm text-gray-500">
                                    No publications found for this magazine in publications_db.
                                  </p>
                                ) : (
                                  <div className="w-full overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th className="w-12 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pick</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edition</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
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

                        {isMagazineAdvert && selectedMagazinePublicationId && (
                          <ServiceAdvertPageTypeList
                            magazinePageType={magazinePageType}
                            magazineSlotKey={magazineSlotKey}
                            onSelectPage={handleSelectPage}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
                </ul>
              )}
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
            disabled={!selected || !canConfirm}
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
