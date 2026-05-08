"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import type { ServiceRow } from "@/app/logged/logged_components/modals/ServiceSelectModal";
import { PublicationService } from "@/app/service/PublicationService";
import {
  fixedPositionForServiceGroup,
  isMagazinePremiumPageGroup,
  preferentialPagePositionLabel,
} from "./magazinePreferentialConstants";

export type PreferentialAvailabilityApi = {
  found: boolean;
  preferential_slot_id?: string;
  publication_id?: string;
  position_in_magazine?: string;
  service_group_id?: string;
  state?: string;
  proposal_id_array?: string[];
  assigned_customer_id?: string | null;
  contract_id?: string | null;
  assigned_customer_name?: string | null;
  assigned_kind?: "summary" | "advertiser_index" | "customer" | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  service: ServiceRow;
  publicationId: string;
  onConfirmPlacement: (args: { preferential_slot_id: string; position_in_magazine: string }) => void;
};

const MagazinePreferentialAvailabilityModal: FC<Props> = ({
  open,
  onClose,
  service,
  publicationId,
  onConfirmPlacement,
}) => {
  const serviceGroupId = String(service.service_group_id ?? "").trim();
  const isPremium = isMagazinePremiumPageGroup(serviceGroupId);
  const fixedPosition = fixedPositionForServiceGroup(serviceGroupId);

  const [premiumSlotNum, setPremiumSlotNum] = useState<number>(1);
  const [activePositionLabel, setActivePositionLabel] = useState<string>("");
  const [data, setData] = useState<PreferentialAvailabilityApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPremiumSlotNum(1);
    setActivePositionLabel("");
    setData(null);
    setLoading(false);
    setFetchError(null);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const load = useCallback(
    async (position_in_magazine: string) => {
      const pub = String(publicationId ?? "").trim();
      const gid = serviceGroupId;
      const pos = String(position_in_magazine ?? "").trim();
      if (!pub || !gid || !pos) return;
      setLoading(true);
      setFetchError(null);
      try {
        const row = (await PublicationService.getPreferentialSlotAvailability(pub, {
          service_group_id: gid,
          position_in_magazine: pos,
        })) as PreferentialAvailabilityApi;
        setData(row ?? { found: false });
      } catch (e: unknown) {
        const msg =
          e != null && typeof e === "object" && "message" in e
            ? String((e as { message?: string }).message)
            : "Could not load availability.";
        setFetchError(msg);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [publicationId, serviceGroupId]
  );

  useEffect(() => {
    if (!open || isPremium || !fixedPosition) return;
    setActivePositionLabel(fixedPosition);
    void load(fixedPosition);
  }, [open, isPremium, fixedPosition, load]);

  const blocked = useMemo(() => {
    if (!data || !data.found) return true;
    const st = String(data.state ?? "").toLowerCase();
    if (st === "bought") return true;
    if (st === "assigned") {
      const k = data.assigned_kind;
      if (k === "summary" || k === "advertiser_index") return true;
    }
    return false;
  }, [data]);

  const messaging = useMemo(() => {
    if (!data?.found) {
      return (
        <p className="text-sm text-red-700">
          No preferential placement record exists for this edition and tariff. Ensure the publication was created after
          preferential slots are provisioned (migrations and publication create flow).
        </p>
      );
    }
    const st = String(data.state ?? "").toLowerCase();

    if (st === "bought") {
      return <p className="text-sm text-red-700 font-medium">This page is bought. It cannot be offered on a new proposal.</p>;
    }

    if (st === "assigned") {
      if (data.assigned_kind === "summary") {
        return (
          <p className="text-sm text-gray-800">
            This page is assigned as the publication <strong>summary</strong>. Open the publication, move the summary to
            another page, then you can sell this placement.
          </p>
        );
      }
      if (data.assigned_kind === "advertiser_index") {
        return (
          <p className="text-sm text-gray-800">
            This page is assigned as the publication <strong>advertiser index</strong>. Open the publication, relocate
            the advertiser index, then you can sell this placement.
          </p>
        );
      }
      if (data.assigned_kind === "customer") {
        const who = data.assigned_customer_name || data.assigned_customer_id || "a customer";
        return (
          <div className="space-y-2 text-sm text-gray-800">
            <p>
              This page is softly assigned to <strong>{who}</strong>. It is <strong>not</strong> sold and <strong>not</strong>{" "}
              under an active competing offer yet.
            </p>
            <p>
              If you continue, that reservation will be <strong>released</strong>, the placement will enter the{" "}
              <strong>offered</strong> flow, and your proposal will compete with any other offers.
            </p>
          </div>
        );
      }
    }

    if (st === "available") {
      return (
        <div className="space-y-2 text-sm text-gray-800">
          <p>
            Nobody else has offered this page yet. The placement is <strong>available</strong>.
          </p>
          <p>
            If you run an offer and another client accepts a competing offer before this customer accepts yours,{" "}
            <strong>this proposal line will expire automatically</strong>.
          </p>
        </div>
      );
    }

    if (st === "offered") {
      const ids = Array.isArray(data.proposal_id_array) ? data.proposal_id_array.filter(Boolean) : [];
      return (
        <div className="space-y-2 text-sm text-gray-800">
          <p>This page is already in the &quot;offered&quot; stage.</p>
          {ids.length > 0 ? (
            <div>
              <p className="font-medium text-gray-900">Proposal ids referencing this competing placement:</p>
              <ul className="mt-1 list-disc list-inside font-mono text-xs text-gray-700 break-all">
                {ids.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-gray-600">No proposal ids are stored on the slot yet (data may be out of sync).</p>
          )}
          <p>
            If you continue, your proposal will join the same competition. The slot stays open to further offers until one
            client accepts first and the page is sold; all other competing proposals will be expired when that happens.
          </p>
        </div>
      );
    }

    return <p className="text-sm text-gray-700">State: {data.state}</p>;
  }, [data]);

  const handlePremiumCheck = () => {
    const label = preferentialPagePositionLabel(premiumSlotNum);
    if (!label) return;
    setActivePositionLabel(label);
    void load(label);
  };

  const handleConfirm = () => {
    if (!data?.found || !data.preferential_slot_id || !activePositionLabel || blocked) return;
    onConfirmPlacement({
      preferential_slot_id: data.preferential_slot_id,
      position_in_magazine: activePositionLabel,
    });
    onClose();
  };

  if (!open) return null;

  const groupLabel =
    service.service_group_name ||
    service.shown_name ||
    service.display_name ||
    serviceGroupId;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mag-pref-avail-title"
    >
      <div className="max-w-lg w-full rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 id="mag-pref-avail-title" className="text-lg font-semibold text-gray-900">
          Preferential page availability
        </h2>
        <p className="mt-1 text-xs text-gray-500 font-mono">{groupLabel}</p>
        <p className="mt-2 text-sm text-gray-600">
          Publication: <span className="font-mono text-gray-800">{publicationId}</span>
        </p>

        {isPremium && (
          <div className="mt-4 space-y-2">
            <label className="block text-sm font-medium text-gray-700">Preferential page (1–9)</label>
            <div className="flex flex-wrap items-end gap-2">
              <select
                value={premiumSlotNum}
                onChange={(e) => setPremiumSlotNum(Number(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <option key={n} value={n}>
                    {n} — {preferentialPagePositionLabel(n)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handlePremiumCheck}
                className="px-3 py-2 text-sm font-medium bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
              >
                Check availability
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Choose the numbered preferential page, then check availability before adding the line.
            </p>
          </div>
        )}

        {!isPremium && fixedPosition && (
          <p className="mt-3 text-sm text-gray-700">
            Placement: <strong>{fixedPosition}</strong>
          </p>
        )}

        {loading && <p className="mt-4 text-sm text-gray-500">Loading…</p>}
        {fetchError && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {fetchError}
          </p>
        )}
        {!loading && !fetchError && (isPremium ? activePositionLabel : true) && (
          <div className="mt-4 space-y-3">{messaging}</div>
        )}

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="rounded-md px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !!fetchError || !data?.found || blocked || (isPremium && !activePositionLabel)}
            className="rounded-md px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to proposal
          </button>
        </div>
      </div>
    </div>
  );
};

export default MagazinePreferentialAvailabilityModal;
