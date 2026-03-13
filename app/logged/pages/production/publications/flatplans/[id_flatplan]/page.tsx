"use client";

import React, { FC, use, useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import flatplansData from "@/app/contents/flatplans.json";
import magazinesData from "@/app/contents/magazines.json";
import plannedPublicationsData from "@/app/contents/planned_publications.json";
import projectsData from "@/app/contents/projects.json";
import contractsData from "@/app/contents/contracts.json";
import customersData from "@/app/contents/customers.json";
import servicesData from "@/app/contents/services.json";
import { Flatplan, FlatplanSlot, Magazine, MagazineIssue } from "@/app/contents/interfaces";

const BASE = "/logged/pages/production/publications/flatplans";

/** Slot keys in display order (excluding meta keys). */
const SLOT_ORDER: (keyof Flatplan)[] = [
  "cover",
  "inside_cover",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "end",
];

/** Slots that are on the LEFT in a spread (for 2-page ad: can only place from left). */
const LEFT_SLOTS = new Set<string>(["inside_cover", "2", "4", "6", "8", "10"]);

/** Index of next slot in SLOT_ORDER (for 2-page content). */
function getNextSlotKey(current: string): string | null {
  const i = SLOT_ORDER.indexOf(current as keyof Flatplan);
  if (i < 0 || i >= SLOT_ORDER.length - 1) return null;
  return SLOT_ORDER[i + 1] as string;
}

/** First half of magazine (columns 1–2): [leftCell, rightCell] per row. */
const MINIATURA_FIRST_HALF: (string | null)[][] = [
  [null, "cover"],
  ["inside_cover", "1"],
  ["2", "3"],
  ["4", "5"],
];
/** Second half of magazine (columns 3–4). Last row: page 10 and end (same spread). */
const MINIATURA_SECOND_HALF: (string | null)[][] = [
  ["6", "7"],
  ["8", "9"],
  ["10", "end"],
];

type ProjectRow = {
  id_project: string;
  id_contract: string;
  customerName: string;
  serviceName: string;
  state: string;
  title: string;
  content_type: "article" | "advert" | "cover" | "inside_cover" | "end";
  pages: 1 | 2;
};

/** Projects that are 2-page for demo (otherwise 1). */
const PAGES_BY_PROJECT: Record<string, 1 | 2> = {
  "proj-004": 2,
  "proj-006": 2,
  "proj-021": 2,
};

const FlatplanDetailPage: FC<{ params: Promise<{ id_flatplan: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_flatplan } = use(params);
  const flatplans = flatplansData as Flatplan[];
  const flatplan = flatplans.find((f) => f.id_flatplan === id_flatplan);

  const [activeTab, setActiveTab] = useState<"preview" | "still">("preview");
  const [slots, setSlots] = useState<Record<string, FlatplanSlot>>({});
  const [dragSlot, setDragSlot] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [addModalForSlot, setAddModalForSlot] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [observations, setObservations] = useState("");
  const [isSpecialEdition, setIsSpecialEdition] = useState(false);
  const [materialsDeadline, setMaterialsDeadline] = useState("");
  const [publicationDeadline, setPublicationDeadline] = useState("");
  const [subscriberList, setSubscriberList] = useState("");
  const [specialTopic, setSpecialTopic] = useState("");

  const { setPageMeta } = usePageContent();

  const magazines = (magazinesData as Magazine[]) || [];
  const magazine = useMemo(
    () => (flatplan?.id_magazine ? magazines.find((m) => m.id_magazine === flatplan.id_magazine) : null),
    [flatplan?.id_magazine, magazines]
  );
  const issue = useMemo((): MagazineIssue | null => {
    if (flatplan?.year == null || flatplan?.issue_number == null || !magazine?.issues_by_year) return null;
    const yearIssues = magazine.issues_by_year[String(flatplan.year)];
    return yearIssues?.find((i) => i.issue_number === flatplan.issue_number) ?? null;
  }, [flatplan?.year, flatplan?.issue_number, magazine?.issues_by_year]);

  const plannedPublications = (plannedPublicationsData as { id_planned_publication: string; edition_name: string }[]) || [];
  const projects = (projectsData as { id_project: string; id_contract: string; title: string; status: string; service: string; publication_id?: string }[]) || [];
  const contracts = (contractsData as { id_contract: string; id_customer: string }[]) || [];
  const customers = (customersData as { id_customer: string; name: string }[]) || [];
  const services = (servicesData as { id_service: string; name: string }[]) || [];

  useEffect(() => {
    if (flatplan) {
      const initial: Record<string, FlatplanSlot> = {};
      SLOT_ORDER.forEach((key) => {
        const v = (flatplan as unknown as Record<string, unknown>)[key];
        if (v && typeof v === "object" && v !== null && "id_project" in v) {
          initial[key as string] = v as FlatplanSlot;
        }
      });
      setSlots(initial);
      setDescription(flatplan.description ?? "");
      setPublicationDeadline(flatplan.publication_date ?? "");
    }
  }, [flatplan?.id_flatplan]);

  useEffect(() => {
    if (issue) {
      setIsSpecialEdition(issue.is_special_edition ?? false);
      setSpecialTopic(issue.special_topic ?? "");
    }
  }, [issue]);

  useEffect(() => {
    if (flatplan) {
      setPageMeta({
        pageTitle: flatplan.edition_name,
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Publications", href: BASE },
          { label: "Flatplans", href: BASE },
          { label: flatplan.edition_name },
        ],
        buttons: [{ label: "Back to Flatplans", href: BASE }],
      });
    } else {
      setPageMeta({
        pageTitle: "Flatplan not found",
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Publications", href: BASE },
          { label: "Flatplans", href: BASE },
        ],
        buttons: [{ label: "Back to Flatplans", href: BASE }],
      });
    }
  }, [setPageMeta, flatplan]);

  const idPlannedPublication = useMemo(() => {
    if (!flatplan?.edition_name) return null;
    const pub = plannedPublications.find((p) => p.edition_name === flatplan.edition_name);
    return pub?.id_planned_publication ?? null;
  }, [flatplan?.edition_name, plannedPublications]);

  const projectsForMagazine = useMemo(() => {
    if (!idPlannedPublication) return [];
    return projects.filter((p) => p.publication_id === idPlannedPublication);
  }, [idPlannedPublication, projects]);

  const projectIdsInFlatplan = useMemo(() => {
    const set = new Set<string>();
    Object.values(slots).forEach((s) => set.add(s.id_project));
    return set;
  }, [slots]);

  const alreadyInFlatplan = useMemo((): ProjectRow[] => {
    return projects
      .filter((p) => projectIdsInFlatplan.has(p.id_project))
      .map((p) => {
        const contract = contracts.find((c) => c.id_contract === p.id_contract);
        const customer = contract ? customers.find((c) => c.id_customer === contract.id_customer) : null;
        const service = services.find((s) => s.id_service === p.service);
        const slotEntry = Object.entries(slots).find(([, s]) => s.id_project === p.id_project);
        const slotData = slotEntry?.[1];
        const content_type = (slotData?.content_type as ProjectRow["content_type"]) || "advert";
        return {
          id_project: p.id_project,
          id_contract: p.id_contract,
          customerName: customer?.name ?? p.id_contract,
          serviceName: service?.name ?? p.service,
          state: p.status,
          title: p.title,
          content_type,
          pages: PAGES_BY_PROJECT[p.id_project] ?? 1,
        };
      });
  }, [projects, projectIdsInFlatplan, contracts, customers, services, slots]);

  const stillNotInFlatplan = useMemo((): ProjectRow[] => {
    return projectsForMagazine
      .filter((p) => !projectIdsInFlatplan.has(p.id_project))
      .map((p) => {
        const contract = contracts.find((c) => c.id_contract === p.id_contract);
        const customer = contract ? customers.find((c) => c.id_customer === contract.id_customer) : null;
        const service = services.find((s) => s.id_service === p.service);
        const isArticle = (p.service === "srv-006" || p.service === "srv-002");
        const content_type: ProjectRow["content_type"] = isArticle ? "article" : "advert";
        return {
          id_project: p.id_project,
          id_contract: p.id_contract,
          customerName: customer?.name ?? p.id_contract,
          serviceName: service?.name ?? p.service,
          state: p.status,
          title: p.title,
          content_type,
          pages: PAGES_BY_PROJECT[p.id_project] ?? 1,
        };
      });
  }, [projectsForMagazine, projectIdsInFlatplan, contracts, customers, services]);

  const slotLabel = (key: string) => {
    if (key === "cover") return "0";
    if (key === "inside_cover") return "Inside cover";
    if (key === "end") return "End";
    return key;
  };

  const getSlotDisplayName = (slot: FlatplanSlot): string => {
    const proj = projects.find((p) => p.id_project === slot.id_project);
    return proj?.title ?? slot.id_project;
  };

  const canDropOn = useCallback(
    (targetSlot: string): boolean => {
      if (!dragSlot) return false;
      const targetHasContent = !!slots[targetSlot];
      return !targetHasContent;
    },
    [dragSlot, slots]
  );

  const handleDragStart = (e: React.DragEvent, slotKey: string) => {
    if (!slots[slotKey]) return;
    setDragSlot(slotKey);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", slotKey);
    e.dataTransfer.setData("application/slot", slotKey);
  };

  const handleDragEnd = () => {
    setDragSlot(null);
    setDragOverSlot(null);
  };

  const handleDragOver = (e: React.DragEvent, slotKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = canDropOn(slotKey) ? "move" : "none";
    setDragOverSlot(slotKey);
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, targetSlot: string) => {
    e.preventDefault();
    setDragOverSlot(null);
    const sourceSlot = e.dataTransfer.getData("application/slot") || e.dataTransfer.getData("text/plain");
    if (!sourceSlot || sourceSlot === targetSlot) {
      setDragSlot(null);
      return;
    }
    if (slots[targetSlot]) {
      setErrorModal("Cannot drop on an occupied slot. Only empty slots accept content.");
      setDragSlot(null);
      return;
    }
    const slotContent = slots[sourceSlot];
    if (!slotContent) {
      setDragSlot(null);
      return;
    }
    setSlots((prev) => {
      const next = { ...prev };
      delete next[sourceSlot];
      next[targetSlot] = slotContent;
      return next;
    });
    setDragSlot(null);
  };

  const handleAddSelect = (slotKey: string, projectId: string) => {
    const proj = stillNotInFlatplan.find((p) => p.id_project === projectId);
    if (!proj) return;

    const pages = proj.pages;
    if (pages === 1) {
      if (slots[slotKey]) {
        setErrorModal("This slot is already occupied.");
        return;
      }
      setSlots((prev) => ({ ...prev, [slotKey]: buildSlotFromProject(proj) }));
      setAddModalForSlot(null);
      return;
    }

    if (proj.content_type === "advert") {
      if (!LEFT_SLOTS.has(slotKey)) {
        setErrorModal("A 2-page ad must be placed starting from a left-hand page (e.g. 2, 4, 6, 8, 10).");
        return;
      }
      const rightSlot = getNextSlotKey(slotKey);
      if (!rightSlot || slots[rightSlot]) {
        setErrorModal("The next page (right) is not available for this 2-page ad.");
        return;
      }
      const slot = buildSlotFromProject(proj);
      setSlots((prev) => ({ ...prev, [slotKey]: slot, [rightSlot]: { ...slot, content_type: "advert" } }));
      setAddModalForSlot(null);
      return;
    }

    if (proj.content_type === "article") {
      const nextSlot = getNextSlotKey(slotKey);
      if (!nextSlot) {
        setErrorModal("There is no next page for this 2-page article.");
        return;
      }
      if (slots[slotKey] || slots[nextSlot]) {
        setErrorModal("Both this page and the next must be empty for a 2-page article.");
        return;
      }
      const slot = buildSlotFromProject(proj);
      setSlots((prev) => ({ ...prev, [slotKey]: slot, [nextSlot]: { ...slot, content_type: "article" } }));
      setAddModalForSlot(null);
    }
  };

  function buildSlotFromProject(proj: ProjectRow): FlatplanSlot {
    const contract = contracts.find((c) => c.id_contract === proj.id_contract);
    const id_advertiser = contract?.id_customer ?? "";
    return {
      id_advertiser,
      id_project: proj.id_project,
      state: proj.state,
      content_type: proj.content_type,
    };
  }

  const handleRemoveFromSlot = (slotKey: string) => {
    setSlots((prev) => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
  };

  if (!flatplan) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-center">
              <p className="text-gray-500">Flatplan not found.</p>
              <button
                type="button"
                onClick={() => router.push(BASE)}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Back to Flatplans
              </button>
            </div>
          </div>
        </div>
      </PageContentSection>
    );
  }

  const ProjectsTable: FC<{ rows: ProjectRow[] }> = ({ rows }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">project_id</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">contract_id</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer (advertiser)</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((r) => (
            <tr key={r.id_project}>
              <td className="px-4 py-3 text-sm text-gray-900">{r.id_project}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{r.id_contract}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{r.customerName}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{r.serviceName}</td>
              <td className="px-4 py-3 text-sm">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{r.state}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="text-sm text-gray-500 py-4 text-center">No projects in this list.</p>
      )}
    </div>
  );

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Magazine</p>
                  <p className="font-medium">{magazine ? `${magazine.name} (${magazine.id_magazine})` : flatplan.id_magazine ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Year</p>
                  <p className="font-medium">{flatplan.year ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Issue</p>
                  <p className="font-medium">{flatplan.issue_number ?? "—"}</p>
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSpecialEdition}
                      onChange={(e) => setIsSpecialEdition(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Special edition</span>
                  </label>
                </div>
              </div>
              {isSpecialEdition && (
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Special topic</label>
                  <input
                    type="text"
                    value={specialTopic}
                    onChange={(e) => setSpecialTopic(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g. Innovation in architectural glass"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Flatplan description"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Observations</label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Observations"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Materials deadline</label>
                  <input
                    type="date"
                    value={materialsDeadline}
                    onChange={(e) => setMaterialsDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Publication deadline</label>
                  <input
                    type="date"
                    value={publicationDeadline}
                    onChange={(e) => setPublicationDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Subscriber list</label>
                <textarea
                  value={subscriberList}
                  onChange={(e) => setSubscriberList(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  placeholder="One email or name per line"
                />
              </div>
            </div>
          </div>
        </div>
      </PageContentSection>

      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "preview"
                  ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Flatplan preview
              <span className="text-xs text-gray-500">({Object.keys(slots).length} in planillo)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("still")}
              className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "still"
                  ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Still not in flatplan
              <span className="text-xs text-gray-500">({stillNotInFlatplan.length})</span>
            </button>
          </div>
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
              {activeTab === "preview" && (
                <>
                <div className="flex gap-6 w-full min-w-0">
                  {/* Left: miniatura (4 columns = first half + second half) — 70% */}
                  <div className="w-[70%] min-w-0">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Planillo (vista miniatura)</h3>
                    <div className="inline-block border border-gray-200 rounded-lg p-2 bg-gray-50">
                      <div className="flex gap-4">
                        {/* First half: 2 columns */}
                        <div className="flex flex-col gap-1">
                          {MINIATURA_FIRST_HALF.map((row, rowIdx) => (
                            <div key={rowIdx} className="flex gap-1">
                              {row.map((cell, colIdx) => {
                                if (cell === null) {
                                  return <div key={colIdx} className="w-[18.9rem] h-[27rem] rounded border border-dashed border-gray-200 bg-transparent" />;
                                }
                                const slot = slots[cell];
                                const pageHref = `${BASE}/${id_flatplan}/${cell}`;
                                return (
                                  <Link
                                    key={cell}
                                    href={pageHref}
                                    className="w-[18.9rem] h-[27rem] rounded border bg-white flex flex-col items-center justify-center text-[10px] font-medium text-gray-600 shadow-sm hover:ring-2 hover:ring-blue-500 hover:border-blue-400 transition-shadow"
                                    title={slotLabel(cell)}
                                  >
                                    <span className="text-gray-400">{slotLabel(cell)}</span>
                                    {slot && <span className="truncate w-full text-center px-0.5" title={getSlotDisplayName(slot)}>•</span>}
                                  </Link>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                        {/* Second half: 2 columns */}
                        <div className="flex flex-col gap-1">
                          {MINIATURA_SECOND_HALF.map((row, rowIdx) => (
                            <div key={rowIdx} className="flex gap-1">
                              {row.map((cell, colIdx) => {
                                if (cell === null) {
                                  return <div key={colIdx} className="w-[18.9rem] h-[27rem] rounded border border-dashed border-gray-200 bg-transparent" />;
                                }
                                const slot = slots[cell];
                                const pageHref = `${BASE}/${id_flatplan}/${cell}`;
                                return (
                                  <Link
                                    key={cell}
                                    href={pageHref}
                                    className="w-[18.9rem] h-[27rem] rounded border bg-white flex flex-col items-center justify-center text-[10px] font-medium text-gray-600 shadow-sm hover:ring-2 hover:ring-blue-500 hover:border-blue-400 transition-shadow"
                                    title={slotLabel(cell)}
                                  >
                                    <span className="text-gray-400">{slotLabel(cell)}</span>
                                    {slot && <span className="truncate w-full text-center px-0.5" title={getSlotDisplayName(slot)}>•</span>}
                                  </Link>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Right: page table — 30% */}
                  <div className="w-[30%] min-w-0 flex-shrink-0">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Páginas y contenido</h3>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Página</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contenido asignado</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {SLOT_ORDER.map((key) => {
                            const slot = slots[key as string];
                            const slotKey = key as string;
                            const isEmpty = !slot;
                            const isDropTarget = dragOverSlot === slotKey;
                            const canDrop = isDropTarget && canDropOn(slotKey);

                            return (
                              <tr
                                key={slotKey}
                                onDragOver={(e) => handleDragOver(e, slotKey)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, slotKey)}
                                className={`${isDropTarget ? (canDrop ? "bg-green-100" : "bg-red-100") : ""}`}
                              >
                                <td className="px-4 py-2 text-sm text-gray-700">{slotLabel(slotKey)}</td>
                                <td className="px-4 py-2">
                                  {slot ? (
                                    <span
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, slotKey)}
                                      onDragEnd={handleDragEnd}
                                      className="inline-block px-2 py-1 rounded border border-gray-200 bg-white cursor-grab active:cursor-grabbing text-sm"
                                    >
                                      {getSlotDisplayName(slot)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-sm">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-2">
                                  {isEmpty ? (
                                    <button
                                      type="button"
                                      onClick={() => setAddModalForSlot(slotKey)}
                                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                    >
                                      Add
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => setAddModalForSlot(slotKey)}
                                        className="text-sm font-medium text-amber-600 hover:text-amber-800 mr-2"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveFromSlot(slotKey)}
                                        className="text-sm font-medium text-red-600 hover:text-red-800"
                                      >
                                        Remove
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Already in flatplan</h3>
                  <ProjectsTable rows={alreadyInFlatplan} />
                </div>
                </>
              )}

              {activeTab === "still" && (
                <>
                  <p className="text-sm text-gray-600 mb-3">
                    Projects that belong to this magazine edition but are not yet placed in the flatplan. Content type, pages and state are shown.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">project_id</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">contract_id</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer (advertiser)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pages</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stillNotInFlatplan.map((r) => (
                          <tr key={r.id_project}>
                            <td className="px-4 py-3 text-sm text-gray-900">{r.id_project}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{r.id_contract}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{r.customerName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{r.serviceName}</td>
                            <td className="px-4 py-3 text-sm capitalize">{r.content_type}</td>
                            <td className="px-4 py-3 text-sm">{r.pages}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{r.state}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {stillNotInFlatplan.length === 0 && (
                      <p className="text-sm text-gray-500 py-4 text-center">No projects in this list.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </PageContentSection>

      {/* Error modal */}
      {errorModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setErrorModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-sm text-gray-700 mb-4">{errorModal}</p>
            <button
              type="button"
              onClick={() => setErrorModal(null)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Add content modal (from Still not) */}
      {addModalForSlot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setAddModalForSlot(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Add content to slot: {slotLabel(addModalForSlot)}</h3>
              <p className="text-sm text-gray-500 mt-1">Choose from projects still not in flatplan</p>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <ul className="divide-y divide-gray-200">
                {stillNotInFlatplan.map((proj) => (
                  <li key={proj.id_project} className="py-2 flex items-center justify-between gap-4">
                    <div>
                      <span className="font-medium text-gray-900">{proj.title}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {proj.content_type} · {proj.pages} pg · {proj.customerName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddSelect(addModalForSlot, proj.id_project)}
                      className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded"
                    >
                      Select
                    </button>
                  </li>
                ))}
              </ul>
              {stillNotInFlatplan.length === 0 && (
                <p className="text-sm text-gray-500 py-4">No available projects to add.</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setAddModalForSlot(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FlatplanDetailPage;
