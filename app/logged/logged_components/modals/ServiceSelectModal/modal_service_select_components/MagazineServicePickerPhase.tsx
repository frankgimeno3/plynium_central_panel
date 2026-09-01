"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import { PublicationService } from "@/app/service/PublicationService";
import type { PreferentialSlotApiRow } from "@/app/logged/pages/production/publications/publication_components/_shared";
import type { MagazineOption, PublicationEditionRow, ServiceEntity, ServiceRow } from "./types";
import {
  findMagazineCatalogService,
  isPreferentialCatalogKey,
  parentGeneralServiceId,
  PREFERENTIAL_CARD_OPTIONS,
  REGULAR_PAGE_OPTIONS,
  type MagazineCatalogKey,
} from "./magazineCatalog";
import {
  isPreferentialSelectable,
  preferentialStatusClass,
  preferentialStatusLabel,
  preferentialUiStatus,
  slotForPosition,
} from "./preferentialSlotUi";
import { PreferentialFlatplanMini } from "./PreferentialFlatplanMini";
import { publicationEditionLabel } from "./helpers";
import {
  isMagazineServiceSelectable,
  magazineServiceAvailabilityClass,
  magazineServiceAvailabilityFromMap,
  magazineServiceAvailabilityLabel,
} from "./magazineServiceAvailabilityUi";

export type MagazinePickerSelection = {
  service: ServiceRow;
  publicationId: string;
  publicationLabel: string;
  publicationDateIso?: string;
  preferential_slot_id?: string;
  position_in_magazine?: string;
  catalogKey: MagazineCatalogKey;
};

type MagazineServicePickerPhaseProps = {
  magazines: MagazineOption[];
  services: ServiceEntity[];
  onBack: () => void;
  onSelect: (selection: MagazinePickerSelection) => void;
};

function serviceToRow(service: ServiceEntity): ServiceRow {
  return {
    id_service: service.id_service,
    name: service.name,
    display_name: service.display_name,
    shown_name: service.shown_name,
    description: String((service as { description?: string }).description ?? ""),
    service_unit_specifications: service.service_unit_specifications,
    tariff_price_eur: service.tariff_price_eur,
    unit: service.unit,
    service_group_id: parentGeneralServiceId(service),
    related_to_other_services: service.related_to_other_services ?? null,
    service_channel: service.service_channel,
    service_type: service.service_type,
  };
}

function publicationDateIso(pub: PublicationEditionRow | null): string | undefined {
  if (!pub) return undefined;
  const raw = pub.real_publication_month_date ?? pub.publication_date;
  if (!raw) return undefined;
  const s = String(raw).trim();
  return s.length >= 10 ? s.slice(0, 10) : s;
}

export const MagazineServicePickerPhase: FC<MagazineServicePickerPhaseProps> = ({
  magazines,
  services,
  onBack,
  onSelect,
}) => {
  const [magazineId, setMagazineId] = useState("");
  const [publicationId, setPublicationId] = useState("");
  const [publications, setPublications] = useState<PublicationEditionRow[]>([]);
  const [publicationsLoading, setPublicationsLoading] = useState(false);
  const [preferentialSlots, setPreferentialSlots] = useState<PreferentialSlotApiRow[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [serviceAvailability, setServiceAvailability] = useState<Record<string, "sold" | "offered">>({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [regularOpen, setRegularOpen] = useState(true);
  const [preferentialOpen, setPreferentialOpen] = useState(true);
  const [selectedPremiumPosition, setSelectedPremiumPosition] = useState<string | null>(null);

  useEffect(() => {
    if (!magazineId) {
      setPublications([]);
      setPublicationId("");
      return;
    }
    setPublicationsLoading(true);
    PublicationService.listPublicationsForMagazine(magazineId)
      .then((list: unknown[]) => {
        const rows = Array.isArray(list) ? list : [];
        setPublications(
          rows
            .filter((r): r is Record<string, unknown> => r !== null && typeof r === "object")
            .map((o) => ({
              id_publication: String(o.id_publication ?? o.publication_id ?? o.id ?? "").trim(),
              edition_name: o.edition_name != null ? String(o.edition_name) : undefined,
              publication_edition_name:
                o.publication_edition_name != null ? String(o.publication_edition_name) : undefined,
              publication_date: o.publication_date != null ? String(o.publication_date) : undefined,
              real_publication_month_date:
                o.real_publication_month_date != null ? String(o.real_publication_month_date) : undefined,
            }))
            .filter((p) => p.id_publication.length > 0)
        );
      })
      .catch(() => setPublications([]))
      .finally(() => setPublicationsLoading(false));
  }, [magazineId]);

  useEffect(() => {
    if (!publicationId) {
      setPreferentialSlots([]);
      setServiceAvailability({});
      setSelectedPremiumPosition(null);
      return;
    }
    setSlotsLoading(true);
    setAvailabilityLoading(true);
    Promise.all([
      PublicationService.listPreferentialSlotsForPublication(publicationId, true),
      PublicationService.getMagazineServiceAvailability(publicationId),
    ])
      .then(([slotData, availability]) => {
        const slots = Array.isArray((slotData as { slots?: PreferentialSlotApiRow[] })?.slots)
          ? (slotData as { slots: PreferentialSlotApiRow[] }).slots
          : [];
        setPreferentialSlots(slots);
        const byServiceId =
          availability &&
          typeof availability === "object" &&
          "by_service_id" in availability &&
          availability.by_service_id &&
          typeof availability.by_service_id === "object"
            ? (availability.by_service_id as Record<string, "sold" | "offered">)
            : {};
        setServiceAvailability(byServiceId);
      })
      .catch(() => {
        setPreferentialSlots([]);
        setServiceAvailability({});
      })
      .finally(() => {
        setSlotsLoading(false);
        setAvailabilityLoading(false);
      });
  }, [publicationId]);

  const selectedPublication = useMemo(
    () => publications.find((p) => p.id_publication === publicationId) ?? null,
    [publications, publicationId]
  );

  const commitSelection = (
    service: ServiceEntity,
    key: MagazineCatalogKey,
    slot?: PreferentialSlotApiRow | null,
    position?: string
  ) => {
    if (!publicationId || !selectedPublication) return;
    onSelect({
      service: serviceToRow(service),
      publicationId,
      publicationLabel: publicationEditionLabel(selectedPublication),
      publicationDateIso: publicationDateIso(selectedPublication),
      catalogKey: key,
      ...(slot?.preferential_slot_id && position
        ? {
            preferential_slot_id: String(slot.preferential_slot_id),
            position_in_magazine: position,
          }
        : {}),
    });
  };

  const handleRegularPick = (key: MagazineCatalogKey) => {
    if (!magazineId || !publicationId) return;
    const service = findMagazineCatalogService(services, magazineId, key);
    if (!service) return;
    const availability = magazineServiceAvailabilityFromMap(serviceAvailability, service.id_service);
    if (!isMagazineServiceSelectable(availability)) return;
    commitSelection(service, key);
  };

  const handlePreferentialPick = (key: MagazineCatalogKey, position?: string) => {
    if (!magazineId || !publicationId) return;
    const service = findMagazineCatalogService(services, magazineId, key);
    if (!service) return;

    if (key === "premium_page" && position) {
      const slot = slotForPosition(preferentialSlots, position);
      const status = preferentialUiStatus(slot);
      if (!slot || !isPreferentialSelectable(status)) return;
      setSelectedPremiumPosition(position);
      commitSelection(service, key, slot, position);
      return;
    }

    const pos = position ?? PREFERENTIAL_CARD_OPTIONS.find((o) => o.key === key)?.position;
    if (!pos) return;
    const slot = slotForPosition(preferentialSlots, pos);
    const status = preferentialUiStatus(slot);
    if (!slot || !isPreferentialSelectable(status)) return;
    commitSelection(service, key, slot, pos);
  };

  const regularRows = REGULAR_PAGE_OPTIONS.map((opt) => ({
    ...opt,
    service: magazineId ? findMagazineCatalogService(services, magazineId, opt.key) : null,
  }));

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
      >
        ← Back to channels
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Magazine <span className="text-red-500">*</span>
          </label>
          <select
            value={magazineId}
            onChange={(e) => {
              setMagazineId(e.target.value);
              setPublicationId("");
              setSelectedPremiumPosition(null);
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
          >
            <option value="">Select magazine…</option>
            {magazines.map((m) => (
              <option key={m.id_magazine} value={m.id_magazine}>
                {m.name} ({m.id_magazine})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Edition / publication <span className="text-red-500">*</span>
          </label>
          <select
            value={publicationId}
            onChange={(e) => {
              setPublicationId(e.target.value);
              setSelectedPremiumPosition(null);
            }}
            disabled={!magazineId || publicationsLoading}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white disabled:opacity-60"
          >
            <option value="">
              {publicationsLoading ? "Loading editions…" : "Select edition…"}
            </option>
            {publications.map((p) => (
              <option key={p.id_publication} value={p.id_publication}>
                {publicationEditionLabel(p)} — {p.id_publication}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!magazineId && (
        <p className="text-sm text-gray-500">Choose a magazine to see available services for that title.</p>
      )}

      {magazineId && !publicationId && (
        <p className="text-sm text-gray-500">Choose an edition to check page availability and services.</p>
      )}

      {magazineId && publicationId && (
        <>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setRegularOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-800 hover:bg-gray-100"
            >
              Regular pages
              <span className="text-gray-400">{regularOpen ? "▾" : "▸"}</span>
            </button>
            {regularOpen && (
              <div className="p-4 space-y-2 border-t border-gray-200">
                {availabilityLoading && (
                  <p className="text-xs text-gray-500 mb-2">Loading service availability…</p>
                )}
                {regularRows.map(({ key, label, service }) => {
                  const availability = magazineServiceAvailabilityFromMap(
                    serviceAvailability,
                    service?.id_service
                  );
                  const selectable = Boolean(service) && isMagazineServiceSelectable(availability);
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!selectable}
                      onClick={() => service && handleRegularPick(key)}
                      className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${magazineServiceAvailabilityClass(availability)}`}
                    >
                      <span className="font-medium">{label}</span>
                      <span className="text-xs font-semibold">
                        {!service
                          ? "Not in catalog"
                          : `${magazineServiceAvailabilityLabel(availability)} · ${service.tariff_price_eur} €`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setPreferentialOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-800 hover:bg-gray-100"
            >
              Preferential pages
              <span className="text-gray-400">{preferentialOpen ? "▾" : "▸"}</span>
            </button>
            {preferentialOpen && (
              <div className="p-4 border-t border-gray-200">
                {slotsLoading ? (
                  <p className="text-sm text-gray-500">Loading preferential availability…</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <PreferentialFlatplanMini
                      slots={preferentialSlots}
                      selectedPosition={selectedPremiumPosition}
                      onSelectPosition={(position, slot) => handlePreferentialPick("premium_page", position)}
                    />
                    <div className="space-y-2">
                      {PREFERENTIAL_CARD_OPTIONS.map(({ key, label, position }) => {
                        if (key === "premium_page") {
                          return (
                            <div
                              key={key}
                              className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600"
                            >
                              <p className="font-semibold text-gray-800">{label}</p>
                              <p className="text-xs mt-1">Select a numbered page on the flatplan (left).</p>
                            </div>
                          );
                        }
                        const slot = position ? slotForPosition(preferentialSlots, position) : null;
                        const status = preferentialUiStatus(slot);
                        const selectable = isPreferentialSelectable(status);
                        return (
                          <button
                            key={key}
                            type="button"
                            disabled={!selectable || !findMagazineCatalogService(services, magazineId, key)}
                            onClick={() => handlePreferentialPick(key, position)}
                            className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${preferentialStatusClass(status)}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold">{label}</span>
                              <span className="text-xs font-medium">{preferentialStatusLabel(status)}</span>
                            </div>
                            {slot && status === "offered" && (
                              <p className="text-[11px] mt-1 opacity-80">Competing offers exist — still eligible.</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
