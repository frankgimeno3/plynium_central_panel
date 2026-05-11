"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { MagazineService } from "@/app/service/MagazineService";
import { PortalService } from "@/app/service/PortalService";
import { Magazine } from "@/app/contents/interfaces";

type PortalRow = { id: number; key: string; name: string };

export type SelectedMagazineContext = {
  magazine: Magazine;
  portal: PortalRow;
};

type PortalMagazineSelectModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (selection: SelectedMagazineContext) => void;
};

export const PortalMagazineSelectModal: FC<PortalMagazineSelectModalProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const [step, setStep] = useState<"portal" | "magazine">("portal");
  const [portals, setPortals] = useState<PortalRow[]>([]);
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [magazineIdsForPortal, setMagazineIdsForPortal] = useState<Set<string>>(new Set());
  const [selectedPortal, setSelectedPortal] = useState<PortalRow | null>(null);
  const [selectedMagazine, setSelectedMagazine] = useState<Magazine | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magazineFilter, setMagazineFilter] = useState({ id: "", name: "" });

  const reset = useCallback(() => {
    setStep("portal");
    setSelectedPortal(null);
    setSelectedMagazine(null);
    setMagazineIdsForPortal(new Set());
    setMagazineFilter({ id: "", name: "" });
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [portalList, magazineList] = await Promise.all([
          PortalService.getAllPortals(),
          MagazineService.getAllMagazines(),
        ]);
        if (cancelled) return;
        setPortals(
          [...(Array.isArray(portalList) ? portalList : [])].sort(
            (a, b) => (Number(a.id) || 0) - (Number(b.id) || 0)
          ) as PortalRow[]
        );
        setMagazines(Array.isArray(magazineList) ? magazineList : []);
      } catch (e: unknown) {
        if (!cancelled) {
          setPortals([]);
          setMagazines([]);
          setError(e instanceof Error ? e.message : "Failed to load portals and magazines.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, reset]);

  useEffect(() => {
    if (!open || !selectedPortal) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          portal_id: String(selectedPortal.id),
          status: "draft,planned",
        });
        const res = await fetch(`/api/v1/publications-db?${params.toString()}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load magazines for portal.");
        const data = (await res.json()) as Array<{ magazine_id?: string | null }>;
        if (cancelled) return;
        const ids = new Set(
          (Array.isArray(data) ? data : [])
            .map((row) => String(row.magazine_id ?? "").trim())
            .filter(Boolean)
        );
        setMagazineIdsForPortal(ids);
      } catch (e: unknown) {
        if (!cancelled) {
          setMagazineIdsForPortal(new Set());
          setError(e instanceof Error ? e.message : "Failed to load magazines for portal.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, selectedPortal]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const magazinesForPortal = useMemo(() => {
    if (!selectedPortal) return [];
    return magazines.filter((magazine) => magazineIdsForPortal.has(magazine.id_magazine));
  }, [magazines, magazineIdsForPortal, selectedPortal]);

  const filteredMagazines = useMemo(() => {
    let list = magazinesForPortal.filter((magazine) => magazine && typeof magazine.id_magazine === "string");
    if (magazineFilter.id) {
      list = list.filter((magazine) =>
        magazine.id_magazine.toLowerCase().includes(magazineFilter.id.toLowerCase())
      );
    }
    if (magazineFilter.name) {
      list = list.filter((magazine) =>
        (magazine.name || "").toLowerCase().includes(magazineFilter.name.toLowerCase())
      );
    }
    return list;
  }, [magazinesForPortal, magazineFilter]);

  const handleConfirmMagazine = () => {
    if (!selectedPortal || !selectedMagazine) return;
    onSelect({ magazine: selectedMagazine, portal: selectedPortal });
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-magazine-select-title"
    >
      <div
        className="mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 id="portal-magazine-select-title" className="text-lg font-semibold text-gray-900">
            {step === "portal" ? "Select portal" : "Select magazine"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {loading ? <p className="text-sm text-gray-500">Loading…</p> : null}
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {step === "portal" ? (
            <div className="space-y-2">
              {portals.map((portal) => (
                <button
                  key={portal.id}
                  type="button"
                  onClick={() => {
                    setSelectedPortal(portal);
                    setSelectedMagazine(null);
                    setStep("magazine");
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50"
                >
                  <span className="text-sm font-medium text-gray-900">{portal.name || portal.key}</span>
                  <span className="text-xs text-gray-500">{portal.key}</span>
                </button>
              ))}
              {portals.length === 0 && !loading ? (
                <p className="text-sm text-gray-500">No portals configured.</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                Portal: <span className="font-medium">{selectedPortal?.name || selectedPortal?.key}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-600">Magazine ID</label>
                  <input
                    type="text"
                    value={magazineFilter.id}
                    onChange={(event) =>
                      setMagazineFilter((prev) => ({ ...prev, id: event.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Filter by ID"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-600">Magazine name</label>
                  <input
                    type="text"
                    value={magazineFilter.name}
                    onChange={(event) =>
                      setMagazineFilter((prev) => ({ ...prev, name: event.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Filter by name"
                  />
                </div>
              </div>
              <div className="max-h-[40vh] overflow-y-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Magazine</th>
                      <th className="px-3 py-2">ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMagazines.map((magazine) => {
                      const selected = selectedMagazine?.id_magazine === magazine.id_magazine;
                      return (
                        <tr
                          key={magazine.id_magazine}
                          className={`cursor-pointer border-t border-gray-100 ${
                            selected ? "bg-blue-50" : "hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedMagazine(magazine)}
                        >
                          <td className="px-3 py-2 text-gray-900">{magazine.name || "—"}</td>
                          <td className="px-3 py-2 font-mono text-xs text-gray-600">
                            {magazine.id_magazine}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredMagazines.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-3 py-6 text-center text-sm text-gray-500">
                          No magazines found for this portal.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
          {step === "magazine" ? (
            <button
              type="button"
              onClick={() => {
                setStep("portal");
                setSelectedMagazine(null);
              }}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          {step === "magazine" ? (
            <button
              type="button"
              onClick={handleConfirmMagazine}
              disabled={!selectedMagazine}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Select magazine
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
