"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { PortalService } from "@/app/service/PortalService";
import {
  PreferentialSlotApiRow,
  PreferentialSlotBlock,
} from "../[id_publication]/_shared";
import {
  PortalMagazineSelectModal,
  SelectedMagazineContext,
} from "./_components/PortalMagazineSelectModal";
import { PreferentialCustomerSelectModal } from "./_components/PreferentialCustomerSelectModal";
import type { CustomerRow } from "@/app/logged/logged_components/modals/CustomerSelectModal";

type TabId = "table-format" | "ui-format";
type PortalRow = { id: number; key: string; name: string };

type PendingPreferentialSlotRow = {
  preferential_slot_id: string;
  position_in_magazine: string;
  section_title: string;
  state: string;
  contract_id: string | null;
  assigned_customer_id: string | null;
  proposal_ids: string[];
  publication_id: string;
  publication_edition_name: string;
  publication_status: string;
  magazine_id: string | null;
  magazine_name: string | null;
  portal_names: string;
  service_group_id: string;
  service_group_name: string;
};

type PublicationPreferentialSnapshot = {
  publication_id: string;
  publication_edition_name: string;
  publication_status: string;
  slots: PreferentialSlotApiRow[];
};

const BASE = "/logged/pages/production/publications/preferential-pages";
const PUBLICATIONS_BASE = "/logged/pages/production/publications";
const CONTRACTS_BASE = "/logged/pages/account-management/contracts";

function slotMatchesCustomer(slot: PreferentialSlotApiRow, customerId: string): boolean {
  const normalizedCustomerId = customerId.trim().toLowerCase();
  if (!normalizedCustomerId) return true;
  const assigned = String(slot.assigned_customer_id ?? "").trim().toLowerCase();
  if (assigned && assigned === normalizedCustomerId) return true;
  return (slot.proposal_summaries ?? []).some(
    (proposal) => String(proposal.customer_id ?? "").trim().toLowerCase() === normalizedCustomerId
  );
}

function slotIsSold(slot: PreferentialSlotApiRow): boolean {
  const state = String(slot.state ?? "").trim().toLowerCase();
  return state === "bought" || Boolean(slot.contract_id?.trim());
}

const PreferentialPagesPage: FC = () => {
  const router = useRouter();
  const { setPageMeta } = usePageContent();

  const [activeTab, setActiveTab] = useState<TabId>("table-format");
  const [portals, setPortals] = useState<PortalRow[]>([]);
  const [tableRows, setTableRows] = useState<PendingPreferentialSlotRow[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [tableFilter, setTableFilter] = useState({
    portal_id: "",
    magazine_id: "",
    publication_id: "",
    publication_name: "",
    service_group_id: "",
  });

  const [magazineModalOpen, setMagazineModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [magazineContext, setMagazineContext] = useState<SelectedMagazineContext | null>(null);
  const [customerFilterEnabled, setCustomerFilterEnabled] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [uiSnapshots, setUiSnapshots] = useState<PublicationPreferentialSnapshot[]>([]);
  const [uiLoading, setUiLoading] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [visiblePositions, setVisiblePositions] = useState<Record<string, boolean>>({});
  const [showSold, setShowSold] = useState(true);

  useEffect(() => {
    setPageMeta({
      pageTitle: "Preferential pages",
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Publications", href: `${PUBLICATIONS_BASE}/issues` },
        { label: "Preferential pages" },
      ],
      buttons: [{ label: "Generate", href: `${BASE}/generate` }],
    });
  }, [setPageMeta]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const portalList = await PortalService.getAllPortals();
        if (cancelled) return;
        setPortals(
          [...(Array.isArray(portalList) ? portalList : [])].sort(
            (a, b) => (Number(a.id) || 0) - (Number(b.id) || 0)
          ) as PortalRow[]
        );
      } catch {
        if (!cancelled) setPortals([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadTableRows = useCallback(async () => {
    setTableLoading(true);
    setTableError(null);
    try {
      const params = new URLSearchParams();
      if (tableFilter.portal_id) params.set("portal_id", tableFilter.portal_id);
      if (tableFilter.magazine_id) params.set("magazine_id", tableFilter.magazine_id);
      if (tableFilter.publication_id) params.set("publication_id", tableFilter.publication_id);
      if (tableFilter.publication_name) params.set("publication_name", tableFilter.publication_name);
      if (tableFilter.service_group_id) params.set("service_group_id", tableFilter.service_group_id);
      const res = await fetch(
        `/api/v1/publication-preferential-slots/pending${params.toString() ? `?${params.toString()}` : ""}`,
        { cache: "no-store", credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to load preferential pages.");
      const data = (await res.json()) as { rows?: PendingPreferentialSlotRow[] };
      setTableRows(Array.isArray(data?.rows) ? data.rows : []);
    } catch (error: unknown) {
      setTableRows([]);
      setTableError(error instanceof Error ? error.message : "Failed to load preferential pages.");
    } finally {
      setTableLoading(false);
    }
  }, [tableFilter]);

  useEffect(() => {
    if (activeTab !== "table-format") return;
    void loadTableRows();
  }, [activeTab, loadTableRows]);

  const loadUiSnapshots = useCallback(async () => {
    if (!magazineContext?.magazine.id_magazine) {
      setUiSnapshots([]);
      return;
    }
    if (customerFilterEnabled && !selectedCustomer) {
      setUiSnapshots([]);
      return;
    }

    setUiLoading(true);
    setUiError(null);
    try {
      const params = new URLSearchParams({
        magazine_id: magazineContext.magazine.id_magazine,
        status: "draft,planned",
      });
      const pubsRes = await fetch(`/api/v1/publications-db?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!pubsRes.ok) throw new Error("Failed to load pending publications.");
      const publications = (await pubsRes.json()) as Array<{
        publication_id: string;
        publication_edition_name: string;
        publication_status: string;
      }>;

      const snapshots = await Promise.all(
        (Array.isArray(publications) ? publications : []).map(async (publication) => {
          const prefRes = await fetch(
            `/api/v1/publications/${encodeURIComponent(publication.publication_id)}/preferential-slots`,
            { cache: "no-store", credentials: "include" }
          );
          const prefJson = prefRes.ok
            ? ((await prefRes.json()) as { slots?: PreferentialSlotApiRow[] })
            : { slots: [] };
          const slots = Array.isArray(prefJson?.slots) ? prefJson.slots : [];
          return {
            publication_id: publication.publication_id,
            publication_edition_name: publication.publication_edition_name,
            publication_status: publication.publication_status,
            slots,
          } satisfies PublicationPreferentialSnapshot;
        })
      );

      setUiSnapshots(snapshots);
    } catch (error: unknown) {
      setUiSnapshots([]);
      setUiError(error instanceof Error ? error.message : "Failed to load preferential pages.");
    } finally {
      setUiLoading(false);
    }
  }, [customerFilterEnabled, magazineContext, selectedCustomer]);

  useEffect(() => {
    if (activeTab !== "ui-format") return;
    void loadUiSnapshots();
  }, [activeTab, loadUiSnapshots]);

  const availablePositions = useMemo(() => {
    const positions = new Set<string>();
    uiSnapshots.forEach((snapshot) => {
      snapshot.slots.forEach((slot) => {
        const key = String(slot.position_in_magazine ?? "").trim();
        if (key) positions.add(key);
      });
    });
    return [...positions].sort((a, b) => a.localeCompare(b));
  }, [uiSnapshots]);

  useEffect(() => {
    if (availablePositions.length === 0) return;
    setVisiblePositions((prev) => {
      const next = { ...prev };
      availablePositions.forEach((position) => {
        if (next[position] === undefined) next[position] = true;
      });
      return next;
    });
  }, [availablePositions]);

  const filteredUiSnapshots = useMemo(() => {
    const customerId = customerFilterEnabled ? selectedCustomer?.id_customer ?? "" : "";
    return uiSnapshots
      .map((snapshot) => ({
        ...snapshot,
        slots: snapshot.slots.filter((slot) => {
          const position = String(slot.position_in_magazine ?? "").trim();
          if (position && visiblePositions[position] === false) return false;
          if (!showSold && slotIsSold(slot)) return false;
          if (customerId && !slotMatchesCustomer(slot, customerId)) return false;
          return true;
        }),
      }))
      .filter((snapshot) => snapshot.slots.length > 0);
  }, [customerFilterEnabled, selectedCustomer, showSold, uiSnapshots, visiblePositions]);

  useEffect(() => {
    if (!customerFilterEnabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || customerModalOpen) return;
      setCustomerFilterEnabled(false);
      setSelectedCustomer(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [customerFilterEnabled, customerModalOpen]);

  return (
    <PageContentSection className="pt-4">
      <div className="flex w-full flex-col">
        <div className="flex overflow-hidden rounded-t-lg border-b border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() => setActiveTab("table-format")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "table-format"
                ? "border-b-2 border-blue-950 bg-white text-blue-950"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            Table format
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ui-format")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "ui-format"
                ? "border-b-2 border-blue-950 bg-white text-blue-950"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            UI format
          </button>
        </div>

        <div className="rounded-b-lg border border-gray-200 bg-white">
          {activeTab === "table-format" ? (
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wide text-gray-500">
                    Portal
                  </label>
                  <select
                    value={tableFilter.portal_id}
                    onChange={(event) =>
                      setTableFilter((prev) => ({ ...prev, portal_id: event.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">All portals</option>
                    {portals.map((portal) => (
                      <option key={portal.id} value={String(portal.id)}>
                        {portal.name || portal.key}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wide text-gray-500">
                    Magazine ID
                  </label>
                  <input
                    type="text"
                    value={tableFilter.magazine_id}
                    onChange={(event) =>
                      setTableFilter((prev) => ({ ...prev, magazine_id: event.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Filter by magazine ID"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wide text-gray-500">
                    Publication ID
                  </label>
                  <input
                    type="text"
                    value={tableFilter.publication_id}
                    onChange={(event) =>
                      setTableFilter((prev) => ({ ...prev, publication_id: event.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Filter by publication ID"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wide text-gray-500">
                    Publication name
                  </label>
                  <input
                    type="text"
                    value={tableFilter.publication_name}
                    onChange={(event) =>
                      setTableFilter((prev) => ({ ...prev, publication_name: event.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Filter by publication name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wide text-gray-500">
                    Service group ID
                  </label>
                  <input
                    type="text"
                    value={tableFilter.service_group_id}
                    onChange={(event) =>
                      setTableFilter((prev) => ({ ...prev, service_group_id: event.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Filter by service group ID"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void loadTableRows()}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Refresh
                </button>
              </div>

              {tableError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {tableError}
                </p>
              ) : null}

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Portal</th>
                      <th className="px-3 py-2">Magazine</th>
                      <th className="px-3 py-2">Publication ID</th>
                      <th className="px-3 py-2">Publication name</th>
                      <th className="px-3 py-2">Position</th>
                      <th className="px-3 py-2">Service group</th>
                      <th className="px-3 py-2">State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableLoading ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                          Loading preferential pages…
                        </td>
                      </tr>
                    ) : tableRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                          No pending preferential pages found.
                        </td>
                      </tr>
                    ) : (
                      tableRows.map((row) => (
                        <tr
                          key={`${row.preferential_slot_id}:${row.publication_id}:${row.position_in_magazine}`}
                          className="cursor-pointer border-t border-gray-100 hover:bg-blue-50/70"
                          onClick={() =>
                            router.push(`${BASE}/${encodeURIComponent(row.publication_id)}`)
                          }
                        >
                          <td className="px-3 py-2 text-gray-700">{row.portal_names || "—"}</td>
                          <td className="px-3 py-2 text-gray-700">
                            {row.magazine_name || row.magazine_id || "—"}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-gray-700">
                            {row.publication_id}
                          </td>
                          <td className="px-3 py-2 text-gray-900">{row.publication_edition_name || "—"}</td>
                          <td className="px-3 py-2 text-gray-700">{row.section_title}</td>
                          <td className="px-3 py-2 text-gray-700">{row.service_group_name}</td>
                          <td className="px-3 py-2 text-gray-700">{row.state || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 p-4 lg:flex-row">
              <div className="min-w-0 flex-1 space-y-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Magazine</p>
                      <p className="text-sm font-medium text-gray-900">
                        {magazineContext
                          ? `${magazineContext.magazine.name} (${magazineContext.magazine.id_magazine})`
                          : "No magazine selected"}
                      </p>
                      {magazineContext ? (
                        <p className="text-xs text-gray-500">
                          Portal: {magazineContext.portal.name || magazineContext.portal.key}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => setMagazineModalOpen(true)}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Select magazine
                    </button>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">Filter by customer?</p>
                      {customerFilterEnabled && selectedCustomer ? (
                        <p className="text-xs text-gray-500">
                          {selectedCustomer.name} ({selectedCustomer.id_customer})
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`text-sm ${
                          customerFilterEnabled ? "text-gray-500" : "font-medium text-gray-900"
                        }`}
                      >
                        No
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={customerFilterEnabled}
                        aria-label="Filter by customer"
                        onClick={() => {
                          const next = !customerFilterEnabled;
                          setCustomerFilterEnabled(next);
                          if (!next) setSelectedCustomer(null);
                        }}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          customerFilterEnabled ? "bg-blue-600" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                            customerFilterEnabled ? "translate-x-5" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span
                        className={`text-sm ${
                          customerFilterEnabled ? "font-medium text-gray-900" : "text-gray-500"
                        }`}
                      >
                        Yes
                      </span>
                      {customerFilterEnabled ? (
                        <button
                          type="button"
                          onClick={() => setCustomerModalOpen(true)}
                          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Select customer
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {uiError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {uiError}
                  </p>
                ) : null}

                {!magazineContext ? (
                  <p className="text-sm text-gray-500">Select a magazine to load pending publications.</p>
                ) : customerFilterEnabled && !selectedCustomer ? (
                  <p className="text-sm text-gray-500">
                    Select a customer or press Esc to turn the customer filter off.
                  </p>
                ) : uiLoading ? (
                  <p className="text-sm text-gray-500">Loading preferential pages…</p>
                ) : filteredUiSnapshots.length === 0 ? (
                  <p className="text-sm text-gray-500">No preferential pages match the current filters.</p>
                ) : (
                  filteredUiSnapshots.map((snapshot) => (
                    <div
                      key={snapshot.publication_id}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-gray-800">
                            {snapshot.publication_edition_name || snapshot.publication_id}
                          </h3>
                          <p className="font-mono text-xs text-gray-500">{snapshot.publication_id}</p>
                        </div>
                        <Link
                          href={`${BASE}/${encodeURIComponent(snapshot.publication_id)}`}
                          className="text-sm font-medium text-blue-700 hover:text-blue-900"
                        >
                          Open publication detail
                        </Link>
                      </div>
                      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                        {snapshot.slots.map((slot) => (
                          <div
                            key={`${snapshot.publication_id}:${slot.position_in_magazine}`}
                            className="rounded-lg border border-gray-200 bg-white p-3"
                          >
                            <p className="text-sm font-medium text-gray-800">{slot.section_title}</p>
                            <p className="text-xs text-gray-500">{slot.position_in_magazine}</p>
                            <PreferentialSlotBlock slot={slot} />
                            {slotIsSold(slot) && slot.contract_id ? (
                              <Link
                                href={`${CONTRACTS_BASE}/${encodeURIComponent(slot.contract_id)}`}
                                className="mt-3 block rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 hover:border-emerald-300 hover:shadow-sm"
                              >
                                <p className="text-[10px] uppercase tracking-wide text-emerald-700">
                                  Sold contract
                                </p>
                                <p className="font-mono text-xs">{slot.contract_id}</p>
                              </Link>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <aside className="w-full shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-4 lg:w-72">
                <h3 className="text-sm font-semibold text-gray-800">Filters</h3>
                <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={showSold}
                    onChange={(event) => setShowSold(event.target.checked)}
                  />
                  Show sold
                </label>
                <div className="mt-4 space-y-2">
                  {availablePositions.map((position) => (
                    <label key={position} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={visiblePositions[position] !== false}
                        onChange={(event) =>
                          setVisiblePositions((prev) => ({
                            ...prev,
                            [position]: event.target.checked,
                          }))
                        }
                      />
                      {position}
                    </label>
                  ))}
                  {availablePositions.length === 0 ? (
                    <p className="text-sm text-gray-500">No positions loaded yet.</p>
                  ) : null}
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>

      <PortalMagazineSelectModal
        open={magazineModalOpen}
        onClose={() => setMagazineModalOpen(false)}
        onSelect={(selection) => {
          setMagazineContext(selection);
          setVisiblePositions({});
        }}
      />
      <PreferentialCustomerSelectModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSelectCustomer={(customer) => setSelectedCustomer(customer)}
      />
    </PageContentSection>
  );
};

export default PreferentialPagesPage;
