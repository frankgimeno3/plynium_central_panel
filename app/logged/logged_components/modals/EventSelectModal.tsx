"use client";

import React, { FC, useState, useEffect, useCallback } from "react";
import { EventsService } from "@/app/service/EventsService";
import { PortalService } from "@/app/service/PortalService";

export interface EventRow {
  id_fair: string;
  event_name: string;
  region?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
}

interface EventSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectEvent: (eventId: string) => void;
  /** Exclude this event ID from the list (e.g. current event when selecting previous edition) */
  excludeEventId?: string;
}

/** Parse dd/mm/yyyy or d/m/yyyy to YYYY-MM-DD, or null if invalid */
function parseDdMmYyyy(input: string): string | null {
  const t = input.trim().replace(/\s/g, "");
  if (!t) return null;
  const parts = t.split("/");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map((p) => parseInt(p, 10));
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  if (y < 100) return null;
  const year = y < 1000 ? 2000 + y : y;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const lastDay = new Date(year, m, 0).getDate();
  if (d > lastDay) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(m)}-${pad(d)}`;
}

/** Format YYYY-MM-DD to dd/mm/yyyy for display */
function toDdMmYyyy(apiDate: string): string {
  if (!apiDate || apiDate.length < 10) return "";
  const [y, m, d] = apiDate.split("T")[0].split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

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
          ? list.map((p: any) => ({ id: p.id, name: p.name ?? String(p.key ?? p.id) }))
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

  const formatDate = (d: string | undefined) => {
    if (!d) return "—";
    const s = (d as string).split("T")[0];
    if (!s || s.length < 10) return d;
    const [y, m, day] = s.split("-");
    return `${day}/${m}/${y}`;
  };

  if (!open) return null;

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
          <h2
            id="event-select-modal-title"
            className="text-xl font-semibold text-gray-900"
          >
            Select event
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-auto flex-1 min-h-0">
          {/* Filters */}
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-3">Filter</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  ID
                </label>
                <input
                  type="text"
                  value={idFilter}
                  onChange={(e) => setIdFilter(e.target.value)}
                  placeholder="Event ID..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Event name..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Portal
                </label>
                <select
                  value={portalName}
                  onChange={(e) => setPortalName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950/20"
                >
                  <option value="">All portals</option>
                  {portals.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Date from
                </label>
                <input
                  type="text"
                  value={dateFromDisplay}
                  onChange={(e) => setDateFromDisplay(e.target.value)}
                  placeholder="dd/mm/yyyy"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Date to
                </label>
                <input
                  type="text"
                  value={dateToDisplay}
                  onChange={(e) => setDateToDisplay(e.target.value)}
                  placeholder="dd/mm/yyyy"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950/20"
                />
              </div>
            </div>
            {!isDateRangeValid() && (dateFromDisplay.trim() || dateToDisplay.trim()) && (
              <p className="mt-2 text-xs text-red-600">
                Fill both From and To dates, or clear both.
              </p>
            )}
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={handleApplyFilter}
                disabled={!isDateRangeValid()}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-950 text-white hover:bg-blue-950/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply filter
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            {loading ? (
              <div className="py-12 text-center text-gray-500">
                Loading events...
              </div>
            ) : events.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                No events match the filter.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Region
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((ev) => {
                    const isSelected = selectedEventId === ev.id_fair;
                    return (
                      <tr
                        key={ev.id_fair}
                        onClick={() =>
                          setSelectedEventId(isSelected ? null : ev.id_fair)
                        }
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-100" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">
                          {ev.id_fair}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {ev.event_name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(ev.start_date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(ev.end_date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {ev.region ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
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
