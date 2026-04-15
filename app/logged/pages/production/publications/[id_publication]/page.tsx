"use client";

import React, { FC, use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";

type PublicationDbRow = {
  publication_id: string;
  magazine_id: string | null;
  publication_year: number | null;
  publication_edition_name: string;
  magazine_general_issue_number: number | null;
  magazine_this_year_issue: number | null;
  publication_expected_publication_month: number | null;
  real_publication_month_date: string | null;
  publication_materials_deadline: string | null;
  is_special_edition: boolean;
  publication_theme: string;
  publication_status: "planned" | "draft" | "published" | string;
  publication_format: "flipbook" | "informer" | string;
  publication_main_image_url: string;
};

type SlotRow = {
  publication_slot_id: number;
  publication_id: string | null;
  publication_format: string;
  slot_key: string;
  slot_content_type: string;
  slot_state: string;
  customer_id: string | null;
  project_id: string | null;
  slot_media_url: string | null;
  slot_article_id: string | null;
  slot_created_at: string | null;
  slot_updated_at: string | null;
};

type TabId = "data" | "flatplan";

const BASE = "/logged/pages/production/publications";

function monthName(m: number | null): string {
  if (m == null || m < 1 || m > 12) return "—";
  return new Date(2000, m - 1, 1).toLocaleString("default", { month: "long" });
}

function toNullableInt(v: string): number | null {
  const t = String(v ?? "").trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toNullableMonth(v: string): number | null {
  const n = toNullableInt(v);
  if (n == null) return null;
  if (n < 1 || n > 12) return null;
  return n;
}

function normalizeDateString(v: string): string | null {
  const t = String(v ?? "").trim();
  return t === "" ? null : t;
}

function isNumericSlotKey(k: string): boolean {
  const n = Number(k);
  return Number.isFinite(n) && Number.isInteger(n) && n >= 1;
}

function pageLabelForSlotKey(slotKey: string): string {
  const k = String(slotKey || "");
  if (k === "cover") return "0";
  if (k === "inside_cover") return "1";
  if (k === "end") return "End";
  if (isNumericSlotKey(k)) return String(Number(k) + 1); // numeric keys start after inside_cover
  return k;
}

const PublicationDetailPage: FC<{ params: Promise<{ id_publication: string }> }> = ({ params }) => {
  const { id_publication } = use(params);
  const { setPageMeta } = usePageContent();

  const [activeTab, setActiveTab] = useState<TabId>("data");
  const [publication, setPublication] = useState<PublicationDbRow | null>(null);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pubRes, slotsRes] = await Promise.all([
        fetch(`/api/v1/publications-db/${encodeURIComponent(id_publication)}`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(`/api/v1/publications-db/${encodeURIComponent(id_publication)}/slots`, {
          cache: "no-store",
          credentials: "include",
        }),
      ]);
      if (!pubRes.ok) throw new Error("Failed to load issue");
      const pub = (await pubRes.json()) as PublicationDbRow;
      const slotList = slotsRes.ok ? ((await slotsRes.json()) as SlotRow[]) : [];
      setPublication(pub);
      setSlots(Array.isArray(slotList) ? slotList : []);
    } catch (e: any) {
      setPublication(null);
      setSlots([]);
      setError(e?.message ?? "Failed to load issue");
    } finally {
      setLoading(false);
    }
  }, [id_publication]);

  useEffect(() => {
    load();
  }, [load]);

  const [draftPub, setDraftPub] = useState<PublicationDbRow | null>(null);
  useEffect(() => {
    setDraftPub(publication ? { ...publication } : null);
    setSaveError(null);
  }, [publication?.publication_id]);

  const hasPubChanges = useMemo(() => {
    if (!publication || !draftPub) return false;
    return JSON.stringify(publication) !== JSON.stringify(draftPub);
  }, [publication, draftPub]);

  const savePublication = async () => {
    if (!draftPub || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/v1/publications-db/${encodeURIComponent(id_publication)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          magazine_id: draftPub.magazine_id,
          publication_year: draftPub.publication_year,
          publication_edition_name: draftPub.publication_edition_name,
          magazine_general_issue_number: draftPub.magazine_general_issue_number,
          magazine_this_year_issue: draftPub.magazine_this_year_issue,
          publication_expected_publication_month: draftPub.publication_expected_publication_month,
          real_publication_month_date: draftPub.real_publication_month_date,
          publication_materials_deadline: draftPub.publication_materials_deadline,
          is_special_edition: draftPub.is_special_edition,
          publication_theme: draftPub.publication_theme,
          publication_status: draftPub.publication_status,
          publication_format: draftPub.publication_format,
          publication_main_image_url: draftPub.publication_main_image_url,
        }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Failed to save changes");
      }
      await load();
    } catch (e: any) {
      setSaveError(e?.message ?? "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const title = publication?.publication_edition_name
      ? publication.publication_edition_name
      : `Issue ${id_publication}`;
    setPageMeta({
      pageTitle: title,
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Publications", href: `${BASE}/issues` },
        { label: "Issues", href: `${BASE}/issues` },
        { label: title },
      ],
      buttons: [{ label: "Back to Issues", href: `${BASE}/issues` }],
    });
  }, [setPageMeta, publication?.publication_edition_name, id_publication]);

  const slotEditsKeyed = useMemo(() => {
    const map = new Map<number, SlotRow>();
    slots.forEach((s) => map.set(s.publication_slot_id, { ...s }));
    return map;
  }, [slots]);

  const slotByKey = useMemo(() => {
    const map = new Map<string, SlotRow>();
    slots.forEach((s) => map.set(String(s.slot_key || ""), s));
    return map;
  }, [slots]);

  const numericSlotKeys = useMemo(() => {
    return slots
      .map((s) => String(s.slot_key || ""))
      .filter((k) => isNumericSlotKey(k))
      .sort((a, b) => Number(a) - Number(b));
  }, [slots]);

  const hasCoreSlots = useMemo(() => {
    return {
      cover: slotByKey.has("cover"),
      inside_cover: slotByKey.has("inside_cover"),
      end: slotByKey.has("end"),
    };
  }, [slotByKey]);

  const ensureCoreSlots = React.useCallback(async () => {
    if (!publication) return;

    const createIfMissing = async (slot_key: string) => {
      if (slotByKey.has(slot_key)) return;
      await fetch(`/api/v1/publications-db/${encodeURIComponent(id_publication)}/slots`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          slot_key,
          publication_format: publication.publication_format,
          slot_content_type: "",
          slot_state: "pending",
        }),
      });
    };

    await Promise.all([createIfMissing("cover"), createIfMissing("inside_cover"), createIfMissing("end")]);
  }, [publication, slotByKey, id_publication]);

  useEffect(() => {
    // Ensure core slots exist so preview and navigation always have targets
    if (!publication) return;
    if (hasCoreSlots.cover && hasCoreSlots.inside_cover && hasCoreSlots.end) return;
    ensureCoreSlots()
      .then(() => load())
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publication?.publication_id, hasCoreSlots.cover, hasCoreSlots.inside_cover, hasCoreSlots.end]);

  const addPageAfter = React.useCallback(
    async (afterKey: string) => {
      if (!publication) return;

      // Shift numeric keys > afterKey up by 1 (descending)
      const afterN = Number(afterKey);
      const toShift = numericSlotKeys
        .map((k) => Number(k))
        .filter((n) => n > afterN)
        .sort((a, b) => b - a);

      for (const n of toShift) {
        const slot = slotByKey.get(String(n));
        if (!slot) continue;
        await fetch(`/api/v1/publication-slots/${slot.publication_slot_id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ slot_key: String(n + 1) }),
        });
      }

      // Create the new page at afterN+1
      const newKey = String(afterN + 1);
      await fetch(`/api/v1/publications-db/${encodeURIComponent(id_publication)}/slots`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          slot_key: newKey,
          publication_format: publication.publication_format,
          slot_content_type: "",
          slot_state: "pending",
        }),
      });

      await load();
    },
    [publication, numericSlotKeys, slotByKey, id_publication, load]
  );

  const [slotDrafts, setSlotDrafts] = useState<Record<number, Partial<SlotRow>>>({});
  useEffect(() => {
    // Reset drafts when slots refresh
    setSlotDrafts({});
  }, [id_publication, slots.length]);

  const updateSlotDraft = (slotId: number, patch: Partial<SlotRow>) => {
    setSlotDrafts((prev) => ({
      ...prev,
      [slotId]: { ...(prev[slotId] ?? {}), ...patch },
    }));
  };

  const saveSlot = async (slotId: number) => {
    const patch = slotDrafts[slotId];
    if (!patch || Object.keys(patch).length === 0) return;
    await fetch(`/api/v1/publication-slots/${slotId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        slot_key: patch.slot_key,
        slot_content_type: patch.slot_content_type,
        slot_state: patch.slot_state,
        customer_id: patch.customer_id ?? null,
        project_id: patch.project_id ?? null,
        slot_media_url: patch.slot_media_url ?? null,
        slot_article_id: patch.slot_article_id ?? null,
      }),
    });
    await load();
  };

  if (loading) {
    return (
      <PageContentSection>
        <div className="p-6 text-center text-gray-500">Loading issue…</div>
      </PageContentSection>
    );
  }

  if (!publication) {
    return (
      <PageContentSection>
        <div className="p-6 text-center">
          <p className="text-gray-600">{error ?? "Issue not found."}</p>
          <Link
            href={`${BASE}/issues`}
            className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Back to Issues
          </Link>
        </div>
      </PageContentSection>
    );
  }

  const title = publication.publication_edition_name || `Issue ${publication.publication_id}`;

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="flex border-b border-gray-200 bg-gray-50 rounded-t-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setActiveTab("data")}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "data"
                  ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Data
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("flatplan")}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "flatplan"
                  ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Flatplan
              <span className="ml-2 text-xs text-gray-500">({slots.length} slots)</span>
            </button>
            <div className="flex-1" />
            {activeTab === "data" && (
              <>
                <button
                  type="button"
                  disabled={!hasPubChanges || saving || !draftPub}
                  onClick={savePublication}
                  className="px-4 py-2 my-2 mr-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  disabled={!hasPubChanges || saving}
                  onClick={() => setDraftPub(publication ? { ...publication } : null)}
                  className="px-4 py-2 my-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
              </>
            )}
            <button
              type="button"
              onClick={load}
              className="px-4 py-2 my-2 mr-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
              {activeTab === "data" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {saveError && (
                      <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
                        {saveError}
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Publication ID</p>
                      <p className="font-medium text-gray-900">{publication.publication_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Edition name</p>
                      <input
                        value={draftPub?.publication_edition_name ?? ""}
                        onChange={(e) =>
                          setDraftPub((p) =>
                            p ? { ...p, publication_edition_name: e.target.value } : p
                          )
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Edition name"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Theme</p>
                      <input
                        value={draftPub?.publication_theme ?? ""}
                        onChange={(e) =>
                          setDraftPub((p) => (p ? { ...p, publication_theme: e.target.value } : p))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Theme"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Year</p>
                        <input
                          value={draftPub?.publication_year != null ? String(draftPub.publication_year) : ""}
                          onChange={(e) =>
                            setDraftPub((p) =>
                              p ? { ...p, publication_year: toNullableInt(e.target.value) } : p
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. 2026"
                          inputMode="numeric"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Expected month</p>
                        <input
                          value={
                            draftPub?.publication_expected_publication_month != null
                              ? String(draftPub.publication_expected_publication_month)
                              : ""
                          }
                          onChange={(e) =>
                            setDraftPub((p) =>
                              p
                                ? {
                                    ...p,
                                    publication_expected_publication_month: toNullableMonth(e.target.value),
                                  }
                                : p
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="1-12"
                          inputMode="numeric"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {monthName(draftPub?.publication_expected_publication_month ?? null)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Magazine ID</p>
                        <input
                          value={draftPub?.magazine_id ?? ""}
                          onChange={(e) =>
                            setDraftPub((p) => (p ? { ...p, magazine_id: e.target.value || null } : p))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="mag-001"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Issue # (this year)</p>
                        <input
                          value={draftPub?.magazine_this_year_issue != null ? String(draftPub.magazine_this_year_issue) : ""}
                          onChange={(e) =>
                            setDraftPub((p) =>
                              p ? { ...p, magazine_this_year_issue: toNullableInt(e.target.value) } : p
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. 3"
                          inputMode="numeric"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Status</p>
                        <select
                          value={draftPub?.publication_status ?? "draft"}
                          onChange={(e) =>
                            setDraftPub((p) => (p ? { ...p, publication_status: e.target.value } : p))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="planned">planned</option>
                          <option value="draft">draft</option>
                          <option value="published">published</option>
                        </select>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Format</p>
                        <select
                          value={draftPub?.publication_format ?? "flipbook"}
                          onChange={(e) =>
                            setDraftPub((p) => (p ? { ...p, publication_format: e.target.value } : p))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="flipbook">flipbook</option>
                          <option value="informer">informer</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Materials deadline</p>
                        <input
                          type="date"
                          value={draftPub?.publication_materials_deadline ?? ""}
                          onChange={(e) =>
                            setDraftPub((p) =>
                              p ? { ...p, publication_materials_deadline: normalizeDateString(e.target.value) } : p
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Published date</p>
                        <input
                          type="date"
                          value={draftPub?.real_publication_month_date ?? ""}
                          onChange={(e) =>
                            setDraftPub((p) =>
                              p ? { ...p, real_publication_month_date: normalizeDateString(e.target.value) } : p
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Special edition</p>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Boolean(draftPub?.is_special_edition)}
                          onChange={(e) =>
                            setDraftPub((p) => (p ? { ...p, is_special_edition: e.target.checked } : p))
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-800">This issue is a special edition</span>
                      </label>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Cover image URL</p>
                      <input
                        value={draftPub?.publication_main_image_url ?? ""}
                        onChange={(e) =>
                          setDraftPub((p) => (p ? { ...p, publication_main_image_url: e.target.value } : p))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://…"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                      {draftPub?.publication_main_image_url ? (
                        <img
                          src={draftPub.publication_main_image_url}
                          alt={title}
                          className="w-full aspect-[4/5] object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full aspect-[4/5] flex items-center justify-center text-gray-400">
                          No cover image
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "flatplan" && (
                <div className="flex flex-row gap-6 w-full">
                  <div className="flex flex-col w-1/2 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Flatplan preview</p>
                    <div className="flex flex-col gap-3 border border-gray-200 rounded-lg bg-gray-50 p-4">
                      {/* cover-row */}
                      <div className="flex flex-row justify-end">
                        <Link
                          href={`${BASE}/${encodeURIComponent(id_publication)}/slots/${slotByKey.get("cover")?.publication_slot_id ?? ""}`}
                          className="block"
                        >
                          <div className="aspect-square w-[140px] rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md cursor-pointer p-2 flex flex-col justify-between">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-semibold text-gray-600">0</span>
                              <span className="text-[10px] text-gray-400">cover</span>
                            </div>
                            <div className="text-[10px] text-gray-400">Right</div>
                          </div>
                        </Link>
                      </div>

                      {/* contents-col */}
                      <div className="flex flex-col gap-2">
                        {(() => {
                          const pairs: [string, string | null][] = [];
                          // inside_cover is page 1 (left)
                          const remaining = [...numericSlotKeys];
                          const firstNumeric = remaining.shift() ?? null;
                          pairs.push(["inside_cover", firstNumeric]);
                          for (let i = 0; i < remaining.length; i += 2) {
                            pairs.push([remaining[i], remaining[i + 1] ?? null]);
                          }
                          return pairs;
                        })().map(([leftKey, rightKey], idx) => {
                          const leftSlot = slotByKey.get(leftKey) ?? null;
                          const rightSlot = rightKey ? slotByKey.get(rightKey) ?? null : null;

                          const PageBox = ({
                            slot,
                            slotKey,
                            side,
                            showAddAfter,
                          }: {
                            slot: SlotRow | null;
                            slotKey: string;
                            side: "Left" | "Right";
                            showAddAfter?: boolean;
                          }) => (
                            <div className="flex flex-col gap-2">
                              <Link href={`${BASE}/${encodeURIComponent(id_publication)}/slots/${slot?.publication_slot_id ?? ""}`} className="block">
                                <div className="aspect-square w-[140px] rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md cursor-pointer p-2 flex flex-col justify-between">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-xs font-semibold text-gray-600">
                                      {pageLabelForSlotKey(slotKey)}
                                    </span>
                                    <span className="text-[10px] text-gray-400">{slotKey}</span>
                                  </div>
                                  <div className="text-[10px] text-gray-400">{side}</div>
                                </div>
                              </Link>
                              {showAddAfter && isNumericSlotKey(slotKey) && (
                                <button
                                  type="button"
                                  onClick={() => addPageAfter(slotKey)}
                                  className="w-[140px] px-2 py-1 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50"
                                >
                                  + Add page after
                                </button>
                              )}
                            </div>
                          );

                          return (
                            <div key={idx} className="flex flex-row gap-2">
                              <PageBox slot={leftSlot} slotKey={leftKey} side="Left" showAddAfter={leftKey !== "inside_cover"} />
                              {rightKey ? (
                                <PageBox slot={rightSlot} slotKey={rightKey} side="Right" showAddAfter={true} />
                              ) : (
                                <div className="aspect-square w-[140px]" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* end-row (end is LEFT) */}
                      <div className="flex flex-row justify-start">
                        <Link
                          href={`${BASE}/${encodeURIComponent(id_publication)}/slots/${slotByKey.get("end")?.publication_slot_id ?? ""}`}
                          className="block"
                        >
                          <div className="aspect-square w-[140px] rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md cursor-pointer p-2 flex flex-col justify-between">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-semibold text-gray-600">n</span>
                              <span className="text-[10px] text-gray-400">end</span>
                            </div>
                            <div className="text-[10px] text-gray-400">Left</div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col w-1/2 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Slots (editable)</p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slot</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Media URL</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-56">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {slots.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                            No slots found for this issue.
                          </td>
                        </tr>
                      ) : (
                        slots.map((s) => {
                          const draft = slotDrafts[s.publication_slot_id] ?? {};
                          const current = slotEditsKeyed.get(s.publication_slot_id) ?? s;
                          const value = { ...current, ...draft };
                          const hasChanges = Object.keys(draft).length > 0;

                          return (
                            <tr key={s.publication_slot_id} className="align-top">
                              <td className="px-4 py-3 text-sm">
                                <Link
                                  href={`${BASE}/${encodeURIComponent(id_publication)}/slots/${s.publication_slot_id}`}
                                  className="text-blue-700 hover:text-blue-900 font-medium"
                                >
                                  {s.slot_key}
                                </Link>
                                <div className="text-xs text-gray-400 mt-0.5">#{s.publication_slot_id}</div>
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  value={value.slot_content_type ?? ""}
                                  onChange={(e) => updateSlotDraft(s.publication_slot_id, { slot_content_type: e.target.value })}
                                  className="w-44 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  value={value.slot_state ?? ""}
                                  onChange={(e) => updateSlotDraft(s.publication_slot_id, { slot_state: e.target.value })}
                                  className="w-32 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  value={(value.customer_id ?? "") as string}
                                  onChange={(e) => updateSlotDraft(s.publication_slot_id, { customer_id: e.target.value })}
                                  className="w-36 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="customer_id"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  value={(value.project_id ?? "") as string}
                                  onChange={(e) => updateSlotDraft(s.publication_slot_id, { project_id: e.target.value })}
                                  className="w-36 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="project_id"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  value={(value.slot_media_url ?? "") as string}
                                  onChange={(e) => updateSlotDraft(s.publication_slot_id, { slot_media_url: e.target.value })}
                                  className="w-72 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="https://…"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <button
                                  type="button"
                                  disabled={!hasChanges}
                                  onClick={() => saveSlot(s.publication_slot_id)}
                                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSlotDrafts((prev) => {
                                    const next = { ...prev };
                                    delete next[s.publication_slot_id];
                                    return next;
                                  })}
                                  className="ml-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                  Reset
                                </button>
                                {isNumericSlotKey(String(s.slot_key || "")) && (
                                  <button
                                    type="button"
                                    onClick={() => addPageAfter(String(s.slot_key))}
                                    className="ml-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50"
                                  >
                                    + Add page after
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default PublicationDetailPage;

