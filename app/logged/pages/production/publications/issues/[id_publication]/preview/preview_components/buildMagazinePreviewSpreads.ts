/**
 * Magazine preview = the flatplan slot order rendered as 2-page spreads.
 *
 *   Spread 0:    [ —          | cover           ]    URL token "0"
 *   Spread 1:    [ inside_cov  | preferential 1  ]    URL token "1"
 *   Spread 2..n: [ pp 2        | pp 3            ]    URL token "3"
 *                [ pp 4        | pp 5            ]    URL token "5"
 *                …
 *                [ regular 10  | regular 11      ]    URL token "11"
 *                [ end         | —               ]    URL token = end.publication_page
 *
 * Each spread's URL token is the `publication_page` of its right slot, except:
 * - cover spread uses "0" (cover.publication_page is `-1`)
 * - end-alone spread uses end's own publication_page (the user explicitly asked
 *   for this; otherwise the end's left-position would be invisible to the URL).
 */

import {
    comparePublicationSlotsFlatplanOrder,
    type SlotRow,
} from "@/app/logged/pages/production/publications/publication_components/_shared";

export type MagazinePreviewSpread = {
    /** URL token (`page` segment). */
    label: string;
    leftSlot: SlotRow | null;
    rightSlot: SlotRow | null;
    /** Position in the spreads array (0-based). */
    index: number;
    /** Total number of spreads. */
    total: number;
};

const COVER_KEYS = new Set(["cover"]);
const END_KEYS = new Set(["end", "end_page", "end page"]);

function isCoverSlot(slot: SlotRow): boolean {
    return COVER_KEYS.has(String(slot.slot_key ?? "").trim().toLowerCase());
}

function isEndSlot(slot: SlotRow): boolean {
    return END_KEYS.has(String(slot.slot_key ?? "").trim().toLowerCase());
}

function isPaddingSlot(slot: SlotRow): boolean {
    return String(slot.slot_state ?? "").trim().toLowerCase() === "padding";
}

/** Public page label for an individual slot (matches user expectation). */
export function magazinePreviewPageLabel(slot: SlotRow): string {
    if (isCoverSlot(slot)) return "0";
    const pp = slot.publication_page;
    if (pp != null && Number.isFinite(Number(pp))) return String(Math.round(Number(pp)));
    return String(slot.publication_slot_id);
}

/**
 * Build the ordered spreads list. Padding slots are skipped (they only exist
 * to balance the flatplan grid, not the actual magazine reading order).
 */
export function buildMagazinePreviewSpreads(slots: SlotRow[]): MagazinePreviewSpread[] {
    const sorted = [...slots]
        .filter((s) => !isPaddingSlot(s))
        .sort(comparePublicationSlotsFlatplanOrder);

    if (sorted.length === 0) return [];

    const spreads: Array<{ leftSlot: SlotRow | null; rightSlot: SlotRow | null; label: string }> = [];

    // Spread 0 is always the cover alone on the right.
    const firstIsCover = isCoverSlot(sorted[0]);
    if (firstIsCover) {
        spreads.push({ leftSlot: null, rightSlot: sorted[0], label: "0" });
    } else {
        spreads.push({ leftSlot: null, rightSlot: sorted[0], label: magazinePreviewPageLabel(sorted[0]) });
    }

    const rest = firstIsCover ? sorted.slice(1) : sorted.slice(1);
    for (let i = 0; i < rest.length; i += 2) {
        const left = rest[i] ?? null;
        const right = rest[i + 1] ?? null;
        const labelSource = right ?? left;
        if (!labelSource) continue;
        spreads.push({
            leftSlot: left,
            rightSlot: right,
            label: magazinePreviewPageLabel(labelSource),
        });
    }

    // De-duplicate URL tokens defensively (shouldn't happen with well-formed
    // publication_page values but keeps routing predictable).
    const seenLabels = new Set<string>();
    const total = spreads.length;
    return spreads.map((spread, index) => {
        let label = spread.label;
        let suffix = 1;
        while (seenLabels.has(label)) {
            label = `${spread.label}-${suffix}`;
            suffix += 1;
        }
        seenLabels.add(label);
        return { ...spread, label, index, total };
    });
}

export function findSpreadByLabel(
    spreads: MagazinePreviewSpread[],
    label: string
): MagazinePreviewSpread | null {
    const target = String(label ?? "").trim();
    return spreads.find((s) => s.label === target) ?? null;
}

/** Whether the slot represents the magazine's last (end) page. */
export function isEndPreviewSlot(slot: SlotRow | null | undefined): boolean {
    return Boolean(slot && isEndSlot(slot));
}
