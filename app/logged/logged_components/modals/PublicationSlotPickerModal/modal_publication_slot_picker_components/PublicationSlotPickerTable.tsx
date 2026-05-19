"use client";

import type { SortedSlot } from "./slot_helpers";
import { slotDisplayName, tonesForStateOnDark } from "./slot_helpers";

type SelectionMode = "single" | "multi";

type Props = {
  mode: SelectionMode;
  filteredSlots: SortedSlot[];
  selectedIds: Set<number>;
  isSlotSelectable?: (slot: SortedSlot) => boolean;
  onToggle: (slot: SortedSlot) => void;
};

export function PublicationSlotPickerTable({
  mode,
  filteredSlots,
  selectedIds,
  isSlotSelectable,
  onToggle,
}: Props) {
  return (
    <div className="max-h-[420px] overflow-auto rounded-lg border border-slate-600 bg-slate-950">
      <table className="min-w-full text-sm text-white">
        <thead className="bg-slate-800 text-white">
          <tr>
            <th className="px-3 py-2 text-left font-medium w-10 text-white"> </th>
            <th className="px-3 py-2 text-left font-medium text-white">Slot</th>
            <th className="px-3 py-2 text-left font-medium text-white">Type</th>
            <th className="px-3 py-2 text-left font-medium text-white">State</th>
            <th className="px-3 py-2 text-left font-medium text-white">Customer</th>
            <th className="px-3 py-2 text-left font-medium text-white">Project</th>
          </tr>
        </thead>
        <tbody>
          {filteredSlots.length === 0 ? (
            <tr>
              <td className="px-3 py-6 text-center text-white" colSpan={6}>
                No slots match the filter.
              </td>
            </tr>
          ) : (
            filteredSlots.map((slot) => {
              const selectable = isSlotSelectable ? isSlotSelectable(slot) : true;
              const isSelected = selectedIds.has(slot.publication_slot_id);
              return (
                <tr
                  key={slot.publication_slot_id}
                  className={`border-t border-slate-700 text-white ${
                    selectable ? "cursor-pointer hover:bg-slate-900/90" : "opacity-50"
                  } ${isSelected ? "bg-slate-800/95 ring-1 ring-inset ring-blue-500/40" : ""}`}
                  onClick={() => selectable && onToggle(slot)}
                >
                  <td className="px-3 py-2">
                    <input
                      type={mode === "single" ? "radio" : "checkbox"}
                      checked={isSelected}
                      onChange={() => selectable && onToggle(slot)}
                      disabled={!selectable}
                      className="accent-sky-500"
                    />
                  </td>
                  <td className="px-3 py-2 text-white">
                    <p className="font-medium text-white">
                      {slotDisplayName(slot.slot_key, slot.publication_page)}
                    </p>
                    <p className="text-[11px] font-mono text-white">
                      #{slot.publication_slot_id} · {slot.slot_key || "—"}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-white">{slot.slot_content_type || "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tonesForStateOnDark(
                        slot.slot_state
                      )}`}
                    >
                      {slot.slot_state || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-white">
                    {slot.customer_name?.trim() || slot.customer_id || "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-white">{slot.project_id || "—"}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
