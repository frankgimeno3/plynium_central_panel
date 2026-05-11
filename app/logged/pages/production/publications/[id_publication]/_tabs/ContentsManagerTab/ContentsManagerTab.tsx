"use client";

import { useEffect, useMemo, useState } from "react";
import { ContentsManagerContextSummary } from "./contents_manager_tab_components/ContentsManagerContextSummary";
import { ContentsManagerSubTabNav } from "./contents_manager_tab_components/ContentsManagerSubTabNav";
import { ContentsManagerSubTabPanel } from "./contents_manager_tab_components/ContentsManagerSubTabPanel";
import { CONTENTS_MANAGER_SUB_TABS } from "./contents_manager_tab_components/subTabs";
import type {
  ContentsManagerSubTabId,
  ContentsManagerTabProps,
  LinkedPortalRow,
} from "./contents_manager_tab_components/types";

export function ContentsManagerTab({
  publicationId,
  magazine,
  magazineId,
}: ContentsManagerTabProps) {
  const [activeSubTab, setActiveSubTab] =
    useState<ContentsManagerSubTabId>("should_be_in_magazine");
  const [linkedPortals, setLinkedPortals] = useState<LinkedPortalRow[]>([]);
  const [linkedPortalsLoading, setLinkedPortalsLoading] = useState(true);
  const activeMeta = CONTENTS_MANAGER_SUB_TABS.find((tab) => tab.id === activeSubTab) ?? CONTENTS_MANAGER_SUB_TABS[0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLinkedPortalsLoading(true);
      try {
        const res = await fetch(
          `/api/v1/publications/${encodeURIComponent(
            publicationId
          )}/available-portal-articles?limit=1`,
          { cache: "no-store", credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to load publication context");
        const json = (await res.json()) as { portals?: LinkedPortalRow[] };
        if (!cancelled) {
          setLinkedPortals(Array.isArray(json?.portals) ? json.portals : []);
        }
      } catch {
        if (!cancelled) setLinkedPortals([]);
      } finally {
        if (!cancelled) setLinkedPortalsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicationId]);

  const resolvedMagazineId = magazine?.id_magazine ?? magazineId;
  const magazineLabel = magazine?.name?.trim() || resolvedMagazineId || "—";
  const portalsLabel = useMemo(() => {
    if (linkedPortalsLoading) return "Loading…";
    if (!linkedPortals.length) return "No portals linked to this magazine";
    return linkedPortals.map((portal) => `${portal.portal_name} (#${portal.portal_id})`).join(", ");
  }, [linkedPortals, linkedPortalsLoading]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <ContentsManagerContextSummary
        resolvedMagazineId={resolvedMagazineId}
        magazineLabel={magazineLabel}
        portalsLabel={portalsLabel}
      />

      <ContentsManagerSubTabNav
        activeSubTab={activeSubTab}
        onChange={setActiveSubTab}
        description={activeMeta.description}
      />

      <div className="w-full">
        <ContentsManagerSubTabPanel activeSubTab={activeSubTab} publicationId={publicationId} />
      </div>
    </div>
  );
}
