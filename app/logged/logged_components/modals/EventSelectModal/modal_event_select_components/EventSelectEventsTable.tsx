"use client";

import { formatIsoDateDdMmYy } from "./event_date_helpers";
import type { EventRow } from "./types";

type Props = {
  loading: boolean;
  events: EventRow[];
  selectedEventId: string | null;
  onToggleEvent: (id: string, isSelected: boolean) => void;
};

export function EventSelectEventsTable({ loading, events, selectedEventId, onToggleEvent }: Props) {
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {loading ? (
        <div className="py-6 md:py-8 text-center text-gray-500">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="py-6 md:py-8 text-center text-gray-500">No events match the filter.</div>
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
                  onClick={() => onToggleEvent(ev.id_fair, isSelected)}
                  className={`cursor-pointer transition-colors ${isSelected ? "bg-blue-100" : "hover:bg-gray-50"}`}
                >
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">{ev.id_fair}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{ev.event_name ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatIsoDateDdMmYy(ev.start_date)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatIsoDateDdMmYy(ev.end_date)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{ev.region ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
