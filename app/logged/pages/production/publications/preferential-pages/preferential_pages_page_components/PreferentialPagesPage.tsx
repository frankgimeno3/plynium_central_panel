"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { PortalService } from "@/app/service/PortalService";
import { PreferentialSlotApiRow } from "@/app/logged/pages/production/publications/publication_components/_shared";
import {
  PortalMagazineSelectModal,
  SelectedMagazineContext,
} from "./preferential_pages_page_components/PortalMagazineSelectModal";
import { PreferentialCustomerSelectModal } from "./preferential_pages_page_components/PreferentialCustomerSelectModal";
import type { CustomerRow } from "@/app/logged/logged_components/modals/CustomerSelectModal";
import {
  PREFERENTIAL_PAGES_BASE,
  PUBLICATIONS_BASE,
} from "./preferential_pages_constants";
import type {
  PendingPreferentialSlotRow,
  PortalRow,
  PreferentialPagesTabId,
  PublicationPreferentialSnapshot,
} from "./preferential_pages_types";
import { slotIsSold, slotMatchesCustomer } from "./preferential_pages_types";
import { TableFormatTab } from "./_tabs/TableFormatTab/TableFormatTab";
import { UiFormatTab } from "./_tabs/UiFormatTab/UiFormatTab";
import { PreferentialPagesTabNav } from "./preferential_pages_page_components/PreferentialPagesTabNav";

const PreferentialPagesPage: FC = () => {
  const { setPageMeta } = usePageContent();

  const [activeTab, setActiveTab] = useState<PreferentialPagesTabId>("table-format");
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
      buttons: [{ label: "Generate", href: `${PREFERENTIAL_PAGES_BASE}/generate` }],
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
        <PreferentialPagesTabNav activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="rounded-b-lg border border-gray-200 bg-white">
          {activeTab === "table-format" ? (
            <TableFormatTab
              portals={portals}
              tableFilter={tableFilter}
              setTableFilter={setTableFilter}
              tableRows={tableRows}
              tableLoading={tableLoading}
              tableError={tableError}
              onRefresh={loadTableRows}
            />
          ) : (
            <UiFormatTab
              magazineContext={magazineContext}
              onOpenMagazineModal={() => setMagazineModalOpen(true)}
              customerFilterEnabled={customerFilterEnabled}
              onCustomerFilterEnabledChange={(enabled) => {
                setCustomerFilterEnabled(enabled);
                if (!enabled) setSelectedCustomer(null);
              }}
              selectedCustomer={selectedCustomer}
              onOpenCustomerModal={() => setCustomerModalOpen(true)}
              uiError={uiError}
              uiLoading={uiLoading}
              filteredUiSnapshots={filteredUiSnapshots}
              availablePositions={availablePositions}
              visiblePositions={visiblePositions}
              setVisiblePositions={setVisiblePositions}
              showSold={showSold}
              setShowSold={setShowSold}
            />
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
