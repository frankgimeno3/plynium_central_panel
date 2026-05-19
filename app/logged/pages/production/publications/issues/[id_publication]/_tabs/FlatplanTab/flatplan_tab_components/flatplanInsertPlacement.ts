import {
  flatplanEntryKeyFromSlot,
  flatplanSlotSortKey,
  magazineSlotsTablePrimaryLabel,
  preferentialPublicationPageFromSlot,
  type SlotRow,
} from "@/app/logged/pages/production/publications/publication_components/_shared";

export type FlatplanInsertAdjacentSide = "before" | "after";

export type FlatplanAddSlotPlacement =
  | { kind: "after_numeric_9" }
  | { kind: "before_end" }
  | { kind: "toolbar" }
  | { kind: "adjacent"; entryKey: string; side: FlatplanInsertAdjacentSide };

export function isEndSlotRow(s: SlotRow): boolean {
  const k = String(s.slot_key ?? "").trim().toLowerCase();
  return k === "end" || k === "end_page" || k === "end page";
}

export function isStructuralPreferentialNineSlotRow(s: SlotRow): boolean {
  return preferentialPublicationPageFromSlot(s) === 9;
}

/** Inclusive integer bounds: pages `minPage`…`maxPage` where `maxPage` is the current end slot page (may equal chosen insertion target; end shifts forward on insert). */
export type EditorialPublicationIntegerBounds = {
  minPage: number;
  maxPage: number;
};

export function editorialPublicationPageBoundsInclusive(
  sortedSlots: SlotRow[]
): EditorialPublicationIntegerBounds | null {
  const idxEnd = sortedSlots.findIndex(isEndSlotRow);
  if (idxEnd < 0) return null;
  const raw = Number(sortedSlots[idxEnd].publication_page);
  if (!Number.isFinite(raw)) return null;
  const maxPage = Math.round(raw);
  return { minPage: 10, maxPage };
}

/** Default whole-number page when opening the add-slot modal from a placement hint. */
export function suggestInitialEditorialPublicationPage(
  prev: SlotRow | undefined,
  next: SlotRow | undefined,
  bounds: EditorialPublicationIntegerBounds | null
): number {
  if (!bounds) return 10;
  const approx = midPublicationPage(prev, next);
  let rounded = Math.round(approx);
  if (!Number.isFinite(rounded)) rounded = bounds.maxPage;
  return Math.min(bounds.maxPage, Math.max(bounds.minPage, rounded));
}

/** Prefer persisted `publication_page`; otherwise approximate from flatplan entry key (legacy fallback). */
export function slotPublicationPageApprox(slot: SlotRow): number {
  const pp = slot.publication_page;
  if (pp != null && Number.isFinite(Number(pp))) return Number(pp);
  const key = flatplanEntryKeyFromSlot(slot);
  return flatplanSlotSortKey(key) * 1_000_000 + slot.publication_slot_id;
}

/** Midpoint insert between neighbours in `publication_page` space (used for new `regular_page` rows). */
export function midPublicationPage(prev: SlotRow | undefined, next: SlotRow | undefined): number {
  if (prev != null && next != null) {
    return (slotPublicationPageApprox(prev) + slotPublicationPageApprox(next)) / 2;
  }
  if (prev != null) return slotPublicationPageApprox(prev) + 0.001;
  if (next != null) return slotPublicationPageApprox(next) - 0.001;
  return 9.5;
}

export function placementNeighbors(
  sortedSlots: SlotRow[],
  placement: FlatplanAddSlotPlacement
): { prev?: SlotRow; next?: SlotRow; label: string } {
  const idxNine = sortedSlots.findIndex(isStructuralPreferentialNineSlotRow);
  const idxEnd = sortedSlots.findIndex(isEndSlotRow);

  if (placement.kind === "after_numeric_9") {
    if (idxNine < 0) {
      const fb = placementNeighbors(sortedSlots, { kind: "before_end" });
      return {
        ...fb,
        label: "After preferential page 9 (page 9 not found — defaulted near end)",
      };
    }
    const prev = sortedSlots[idxNine];
    const next = sortedSlots[idxNine + 1];
    return {
      prev,
      next,
      label: "Below interior spread containing preferential page 9",
    };
  }

  if (placement.kind === "before_end" || placement.kind === "toolbar") {
    if (idxEnd < 0) {
      const last = sortedSlots[sortedSlots.length - 1];
      return {
        prev: last,
        next: undefined,
        label: "End of flatplan list",
      };
    }
    return {
      prev: idxEnd > 0 ? sortedSlots[idxEnd - 1] : undefined,
      next: sortedSlots[idxEnd],
      label:
        placement.kind === "toolbar"
          ? "Flatplan — new editorial page"
          : "Immediately above the end page",
    };
  }

  const idx = sortedSlots.findIndex((s) => flatplanEntryKeyFromSlot(s) === placement.entryKey);
  if (idx < 0) {
    const fb = placementNeighbors(sortedSlots, { kind: "toolbar" });
    return { ...fb, label: "Adjacent slot" };
  }
  const labelBase = magazineSlotsTablePrimaryLabel(sortedSlots[idx]);
  if (placement.side === "before") {
    return {
      prev: idx > 0 ? sortedSlots[idx - 1] : undefined,
      next: sortedSlots[idx],
      label: `Before ${labelBase} (#${sortedSlots[idx].publication_slot_id})`,
    };
  }
  return {
    prev: sortedSlots[idx],
    next: idx + 1 < sortedSlots.length ? sortedSlots[idx + 1] : undefined,
    label: `After ${labelBase} (#${sortedSlots[idx].publication_slot_id})`,
  };
}
