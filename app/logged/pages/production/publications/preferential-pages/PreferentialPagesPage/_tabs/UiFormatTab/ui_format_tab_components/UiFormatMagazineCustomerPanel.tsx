"use client";

import React, { FC } from "react";
import type { SelectedMagazineContext } from "../../../preferential_pages_page_components/PortalMagazineSelectModal";
import type { CustomerRow } from "@/app/logged/logged_components/modals/CustomerSelectModal";

type UiFormatMagazineCustomerPanelProps = {
  magazineContext: SelectedMagazineContext | null;
  onOpenMagazineModal: () => void;
  customerFilterEnabled: boolean;
  onCustomerFilterEnabledChange: (enabled: boolean) => void;
  selectedCustomer: CustomerRow | null;
  onOpenCustomerModal: () => void;
};

export const UiFormatMagazineCustomerPanel: FC<UiFormatMagazineCustomerPanelProps> = ({
  magazineContext,
  onOpenMagazineModal,
  customerFilterEnabled,
  onCustomerFilterEnabledChange,
  selectedCustomer,
  onOpenCustomerModal,
}) => (
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
        onClick={onOpenMagazineModal}
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
            onCustomerFilterEnabledChange(next);
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
            onClick={onOpenCustomerModal}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Select customer
          </button>
        ) : null}
      </div>
    </div>
  </div>
);
