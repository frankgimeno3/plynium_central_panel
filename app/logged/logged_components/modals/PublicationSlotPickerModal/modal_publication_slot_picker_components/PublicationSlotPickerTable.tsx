"use client";

import type { SortedSlot } from "./slot_helpers";
import { slotDisplayName, tonesForState } from "./slot_helpers";

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
    <div className="max-h-[420px] overflow-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-3 py-2 text-left font-medium w-10"> </th>
            <th className="px-3 py-2 text-left font-medium">Slot</th>
            <th className="px-3 py-2 text-left font-medium">Type</th>
            <th className="px-3 py-2 text-left font-medium">State</th>
            <th className="px-3 py-2 text-left font-medium">Customer</th>
            <th className="px-3 py-2 text-left font-medium">Project</th>
          </tr>
        </thead>
        <tbody>
          {filteredSlots.length === 0 ? (
            <tr>
              <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
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
                  className={`border-t border-gray-200 ${
                    selectable ? "hover:bg-blue-50/40 cursor-pointer" : "opacity-60"
                  } ${isSelected ? "bg-blue-50/70" : ""}`}
                  onClick={() => selectable && onToggle(slot)}
                >
                  <td className="px-3 py-2">
                    <input
                      type={mode === "single" ? "radio" : "checkbox"}
                      checked={isSelected}
                      onChange={() => selectable && onToggle(slot)}
                      disabled={!selectable}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-gray-900">{slotDisplayName(slot.slot_key)}</p>
                    <p className="text-[11px] font-mono text-gray-500">
                      #{slot.publication_slot_id} · {slot.slot_key || "—"}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-gray-700">{slot.slot_content_type || "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tonesForState(
                        slot.slot_state
                      )}`}
                    >
                      {slot.slot_state || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {slot.customer_name?.trim() || slot.customer_id || "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-700 font-mono text-[11px]">{slot.project_id || "—"}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
