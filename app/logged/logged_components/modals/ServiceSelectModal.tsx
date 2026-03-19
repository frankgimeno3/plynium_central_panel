"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import { ServiceService } from "@/app/service/ServiceService";
import publicationsData from "@/app/contents/publications.json";
import { getPlanned, unifiedToPlannedSlots } from "@/app/contents/publicationsHelpers";
import type { PublicationUnified } from "@/app/contents/interfaces";

type Service = {
  id_service: string;
  name: string;
  display_name?: string;
  description: string;
  tariff_price_eur: number;
  unit?: string;
};

export interface ServiceRow {
  id_service: string;
  name: string;
  display_name?: string;
  description: string;
  tariff_price_eur: number;
  unit?: string;
}

type PlannedPublication = {
  id_planned_publication: string;
  edition_name: string;
  theme?: string;
  publication_date?: string;
  offeredPreferentialPages?: { pageType: string; slotKey: string }[];
  [slotKey: string]: unknown;
};

const plannedPublications = (getPlanned(publicationsData as PublicationUnified[]).map(unifiedToPlannedSlots)) as PlannedPublication[];

/** Extra data per service type, passed on confirm */
export type ServiceExtra =
  | { type: "newsletter"; publicationMonth: number; publicationYear: number }
  | { type: "portal_article" }
  | { type: "portal_banner"; startDate: string; endDate: string; calculatedPrice: number }
  | { type: "portal_premium_profile"; startDate: string; endDate: string; calculatedPrice: number }
  | { type: "magazine_article"; id_planned_publication: string }
  | { type: "magazine_advertisement"; id_planned_publication: string; pageType: string; slotKey: string };

function isSlotSold(pub: PlannedPublication, slotKey: string): boolean {
  const slot = pub[slotKey];
  if (!slot || typeof slot !== "object") return false;
  const o = slot as Record<string, unknown>;
  return o.state === "sold" || "id_advertiser" in o;
}

function monthsBetween(start: string, end: string): number {
  const d1 = new Date(start);
  const d2 = new Date(end);
  if (d2 < d1) return 0;
  return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()) + Math.max(0, (d2.getDate() - d1.getDate()) / 30);
}

const PAGE_TYPES = [
  { pageType: "Cover page", slotKey: "cover" },
  { pageType: "Preferential page", slotKey: "inside_cover" },
  { pageType: "Double page", slotKey: "2" },
  { pageType: "Single page", slotKey: "1" },
  { pageType: "End page", slotKey: "end" },
] as const;

interface ServiceSelectModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (service: ServiceRow, extra?: ServiceExtra) => void;
}

const ServiceSelectModal: FC<ServiceSelectModalProps> = ({ open, onClose, onConfirm }) => {
  const [services, setServices] = useState<Service[]>([]);
  useEffect(() => {
    if (open) {
      ServiceService.getAllServices().then((list) => setServices(Array.isArray(list) ? list : [])).catch(() => setServices([]));
    }
  }, [open]);
  const [selected, setSelected] = useState<ServiceRow | null>(null);
  const [publicationMonth, setPublicationMonth] = useState<number>(new Date().getMonth() + 1);
  const [publicationYear, setPublicationYear] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [magazineId, setMagazineId] = useState<string>("");
  const [magazineName, setMagazineName] = useState<string>("");
  const [magazinePageType, setMagazinePageType] = useState<string>("");
  const [magazineSlotKey, setMagazineSlotKey] = useState<string>("");

  const selectedServiceName = selected?.name ?? selected?.id_service ?? "";

  /** Magazine names derived from edition_name (e.g. "Glass Today March 2025" -> "Glass Today") */
  const magazineNames = useMemo(() => {
    const names = new Set<string>();
    plannedPublications.forEach((p) => {
      const parts = (p.edition_name ?? "").trim().split(/\s+/);
      if (parts.length >= 2) names.add(parts.slice(0, -2).join(" "));
      else if (parts.length === 1) names.add(parts[0]);
    });
    return Array.from(names).sort();
  }, []);

  const publicationsByMagazine = useMemo(() => {
    const map = new Map<string, typeof plannedPublications>();
    plannedPublications.forEach((p) => {
      const parts = (p.edition_name ?? "").trim().split(/\s+/);
      const mag = parts.length >= 2 ? parts.slice(0, -2).join(" ") : (p.edition_name ?? "");
      if (!map.has(mag)) map.set(mag, []);
      map.get(mag)!.push(p);
    });
    return map;
  }, []);

  const isQuarterlyService = selectedServiceName === "portal_banner" || selectedServiceName === "portal_premium_profile";
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
        return !!magazineId;
      case "magazine_advertisement":
        return !!magazineId && !!magazinePageType && !!magazineSlotKey;
      default:
        return true;
    }
  }, [selected, selectedServiceName, publicationMonth, publicationYear, startDate, endDate, magazineId, magazinePageType, magazineSlotKey]);

  const selectedPublication = useMemo(
    () => plannedPublications.find((p) => p.id_planned_publication === magazineId),
    [magazineId]
  );

  const pageAvailability = useMemo(() => {
    if (!selectedPublication) return [];
    const offered = selectedPublication.offeredPreferentialPages ?? PAGE_TYPES;
    return offered.map(({ pageType, slotKey }) => ({
      pageType,
      slotKey,
      available: slotKey === "2" ? true : !isSlotSold(selectedPublication, slotKey),
    }));
  }, [selectedPublication]);

  const editionsForSelectedMagazine = useMemo(() => {
    if (!magazineName) return [];
    return (publicationsByMagazine.get(magazineName) ?? []).map((p) => ({
      id: p.id_planned_publication,
      edition_name: p.edition_name,
      publication_date: p.publication_date,
    }));
  }, [magazineName, publicationsByMagazine]);

  const handleConfirm = () => {
    if (!selected || !canConfirm) return;
    let extra: ServiceExtra | undefined;
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
        extra = { type: "magazine_article", id_planned_publication: magazineId };
        break;
      case "magazine_advertisement":
        extra = { type: "magazine_advertisement", id_planned_publication: magazineId, pageType: magazinePageType, slotKey: magazineSlotKey };
        break;
      default:
        break;
    }
    const price = extra && "calculatedPrice" in extra ? extra.calculatedPrice : selected.tariff_price_eur;
    onConfirm({ ...selected, tariff_price_eur: price }, extra);
    setSelected(null);
    setPublicationMonth(new Date().getMonth() + 1);
    setPublicationYear(new Date().getFullYear());
    setStartDate("");
    setEndDate("");
    setMagazineId("");
    setMagazineName("");
    setMagazinePageType("");
    setMagazineSlotKey("");
    onClose();
  };

  const handleClose = () => {
    setSelected(null);
    setMagazineId("");
    setMagazineName("");
    setMagazinePageType("");
    setMagazineSlotKey("");
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Select service</h3>
            <p className="text-sm text-gray-500 mt-0.5">Choose a service to add to the proposal</p>
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
        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4">
          <ul className="space-y-2">
            {services.map((s) => {
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
                        setMagazineId("");
                        setMagazineName("");
                        setMagazinePageType("");
                        setMagazineSlotKey("");
                      }}
                      className="w-full text-left px-4 py-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-medium text-gray-900">{(s.display_name ?? s.name).replace(/_/g, " ")}</span>
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

                        {/* Magazine article: magazine + edition (issue number for the year) */}
                        {sname === "magazine_article" && (
                          <div className="space-y-3 pt-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Magazine</label>
                              <select
                                value={magazineName}
                                onChange={(e) => {
                                  setMagazineName(e.target.value);
                                  setMagazineId("");
                                }}
                                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg"
                              >
                                <option value="">Select magazine</option>
                                {magazineNames.map((name) => (
                                  <option key={name} value={name}>
                                    {name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Edition (issue number for the year)</label>
                              <select
                                value={magazineId}
                                onChange={(e) => setMagazineId(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg"
                                disabled={!magazineName}
                              >
                                <option value="">Select edition</option>
                                {editionsForSelectedMagazine.map((ed) => (
                                  <option key={ed.id} value={ed.id}>
                                    {ed.edition_name}
                                    {ed.publication_date ? ` (${ed.publication_date})` : ""}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Magazine advertisement: magazine + page type with availability */}
                        {sname === "magazine_advertisement" && (
                          <div className="space-y-3 pt-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Magazine</label>
                              <select
                                value={magazineId}
                                onChange={(e) => {
                                  setMagazineId(e.target.value);
                                  setMagazinePageType("");
                                  setMagazineSlotKey("");
                                }}
                                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg"
                              >
                                <option value="">Select magazine</option>
                                {plannedPublications.map((p) => (
                                  <option key={p.id_planned_publication} value={p.id_planned_publication}>
                                    {p.edition_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {selectedPublication && (
                              <div>
                                <label className="block text-xs text-gray-600 mb-2">Available publication — page type</label>
                                <div className="space-y-2">
                                  {pageAvailability.map(({ pageType, slotKey, available }) => (
                                    <button
                                      key={slotKey}
                                      type="button"
                                      disabled={!available}
                                      onClick={() => handleSelectPage(pageType, slotKey, available)}
                                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${
                                        magazineSlotKey === slotKey
                                          ? "border-blue-600 bg-blue-50 text-blue-900"
                                          : available
                                            ? "border-gray-200 hover:bg-gray-50"
                                            : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                                      }`}
                                    >
                                      <span>{pageType}</span>
                                      <span className="text-xs">{available ? "Disponible" : "No disponible"}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
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
