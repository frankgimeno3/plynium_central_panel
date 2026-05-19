"use client";

import React, { FC } from "react";
import type { SelectedMagazineContext } from "../../preferential_pages_page_components/PortalMagazineSelectModal";
import type { CustomerRow } from "@/app/logged/logged_components/modals/CustomerSelectModal";
import type { PublicationPreferentialSnapshot } from "../../preferential_pages_types";
import { UiFormatMagazineCustomerPanel } from "./ui_format_tab_components/UiFormatMagazineCustomerPanel";
import { UiPublicationSnapshotCard } from "./ui_format_tab_components/UiPublicationSnapshotCard";
import { UiFormatPositionFiltersAside } from "./ui_format_tab_components/UiFormatPositionFiltersAside";

export type UiFormatTabProps = {
  magazineContext: SelectedMagazineContext | null;
  onOpenMagazineModal: () => void;
  customerFilterEnabled: boolean;
  onCustomerFilterEnabledChange: (enabled: boolean) => void;
  selectedCustomer: CustomerRow | null;
  onOpenCustomerModal: () => void;
  uiError: string | null;
  uiLoading: boolean;
  filteredUiSnapshots: PublicationPreferentialSnapshot[];
  availablePositions: string[];
  visiblePositions: Record<string, boolean>;
  setVisiblePositions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  showSold: boolean;
  setShowSold: (value: boolean) => void;
};

export const UiFormatTab: FC<UiFormatTabProps> = ({
  magazineContext,
  onOpenMagazineModal,
  customerFilterEnabled,
  onCustomerFilterEnabledChange,
  selectedCustomer,
  onOpenCustomerModal,
  uiError,
  uiLoading,
  filteredUiSnapshots,
  availablePositions,
  visiblePositions,
  setVisiblePositions,
  showSold,
  setShowSold,
}) => (
  <div className="flex flex-col gap-4 p-4 lg:flex-row">
    <div className="min-w-0 flex-1 space-y-4">
      <UiFormatMagazineCustomerPanel
        magazineContext={magazineContext}
        onOpenMagazineModal={onOpenMagazineModal}
        customerFilterEnabled={customerFilterEnabled}
        onCustomerFilterEnabledChange={onCustomerFilterEnabledChange}
        selectedCustomer={selectedCustomer}
        onOpenCustomerModal={onOpenCustomerModal}
      />

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
          <UiPublicationSnapshotCard key={snapshot.publication_id} snapshot={snapshot} />
        ))
      )}
    </div>

    <UiFormatPositionFiltersAside
      showSold={showSold}
      onShowSoldChange={setShowSold}
      availablePositions={availablePositions}
      visiblePositions={visiblePositions}
      onVisiblePositionChange={(position, visible) =>
        setVisiblePositions((prev) => ({ ...prev, [position]: visible }))
      }
    />
  </div>
);
