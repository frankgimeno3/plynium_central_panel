"use client";

import React, { FC, useState, useEffect, useCallback } from "react";
import { EventsService } from "@/app/service/EventsService";
import { PortalService } from "@/app/service/PortalService";
import { EventSelectEventsTable } from "./modal_event_select_components/EventSelectEventsTable";
import { EventSelectFiltersPanel } from "./modal_event_select_components/EventSelectFiltersPanel";
import { parseDdMmYyyy, toDdMmYyyy } from "./modal_event_select_components/event_date_helpers";
import type { EventRow, EventSelectModalProps } from "./modal_event_select_components/types";

export type { EventRow } from "./modal_event_select_components/types";

const EventSelectModal: FC<EventSelectModalProps> = ({
  open,
  onClose,
  onSelectEvent,
  excludeEventId,
}) => {
  const [name, setName] = useState("");
  const [idFilter, setIdFilter] = useState("");
  const [portalName, setPortalName] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateFromDisplay, setDateFromDisplay] = useState("");
  const [dateToDisplay, setDateToDisplay] = useState("");
  const [portals, setPortals] = useState<{ id: number; name: string }[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const fetchPortals = useCallback(async () => {
    try {
      const list = await PortalService.getAllPortals();
      setPortals(
        Array.isArray(list)
          ? list.map((p: { id: number; name?: string; key?: string }) => ({
              id: p.id,
              name: p.name ?? String(p.key ?? p.id),
            }))
          : []
      );
    } catch {
      setPortals([]);
    }
  }, []);

  const fetchEvents = useCallback(
    async (overrides?: { dateFrom?: string; dateTo?: string }) => {
      setLoading(true);
      try {
        const from = overrides?.dateFrom ?? dateFrom;
        const to = overrides?.dateTo ?? dateTo;
        const params: Record<string, string | string[]> = {};
        if (name.trim()) params.name = name.trim();
        if (portalName) params.portalNames = [portalName];
        if (from.trim()) params.dateFrom = from.trim();
        if (to.trim()) params.dateTo = to.trim();
        const data = await EventsService.getAllEvents(params);
        let list = Array.isArray(data) ? data : [];
        if (excludeEventId) list = list.filter((e) => e.id_fair !== excludeEventId);
        if (idFilter.trim()) {
          const q = idFilter.trim().toLowerCase();
          list = list.filter((e) => e.id_fair.toLowerCase().includes(q));
        }
        setEvents(list);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    },
    [name, portalName, dateFrom, dateTo, excludeEventId, idFilter]
  );

  useEffect(() => {
    if (open) fetchPortals();
  }, [open, fetchPortals]);

  useEffect(() => {
    if (open) fetchEvents();
  }, [open, fetchEvents]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setSelectedEventId(null);
  }, [open]);

  useEffect(() => {
    if (open) {
      setDateFromDisplay(dateFrom ? toDdMmYyyy(dateFrom) : "");
      setDateToDisplay(dateTo ? toDdMmYyyy(dateTo) : "");
    }
  }, [open, dateFrom, dateTo]);

  const isDateRangeValid = () => {
    if (!dateFromDisplay.trim() && !dateToDisplay.trim()) return true;
    const from = parseDdMmYyyy(dateFromDisplay);
    const to = parseDdMmYyyy(dateToDisplay);
    return !!from && !!to;
  };

  const handleApplyFilter = () => {
    if (!isDateRangeValid()) return;
    const from = parseDdMmYyyy(dateFromDisplay);
    const to = parseDdMmYyyy(dateToDisplay);
    if (dateFromDisplay.trim() || dateToDisplay.trim()) {
      if (from) setDateFrom(from);
      else setDateFrom("");
      if (to) setDateTo(to);
      else setDateTo("");
    } else {
      setDateFrom("");
      setDateTo("");
    }
    fetchEvents({
      dateFrom: from ?? "",
      dateTo: to ?? "",
    });
  };

  const handleConfirm = () => {
    if (!selectedEventId) return;
    onSelectEvent(selectedEventId);
    onClose();
  };

  if (!open) return null;

  const dateValid = isDateRangeValid();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-select-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl flex flex-col w-full max-w-4xl max-h-[90vh] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
          <h2 id="event-select-modal-title" className="text-xl font-semibold text-gray-900">
            Select event
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-auto flex-1 min-h-0">
          <EventSelectFiltersPanel
            idFilter={idFilter}
            name={name}
            portalName={portalName}
            portals={portals}
            dateFromDisplay={dateFromDisplay}
            dateToDisplay={dateToDisplay}
            dateRangeValid={dateValid}
            showDateError={!dateValid && !!(dateFromDisplay.trim() || dateToDisplay.trim())}
            onChangeIdFilter={setIdFilter}
            onChangeName={setName}
            onChangePortal={setPortalName}
            onChangeFromDisplay={setDateFromDisplay}
            onChangeToDisplay={setDateToDisplay}
            onApply={handleApplyFilter}
          />

          <EventSelectEventsTable
            loading={loading}
            events={events}
            selectedEventId={selectedEventId}
            onToggleEvent={(id, isSelected) => setSelectedEventId(isSelected ? null : id)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 shrink-0 bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedEventId}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-950 rounded-lg hover:bg-blue-950/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventSelectModal;
