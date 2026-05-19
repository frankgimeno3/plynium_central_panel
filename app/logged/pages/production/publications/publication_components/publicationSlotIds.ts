/** Magazine page slot id on a chunk (post–migration 045). */
export function chunkPublicationSlotId(chunk: {
  publication_slot_id?: number | null;
  /** @deprecated same as publication_slot_id after slot content merge */
  publication_slot_content_id?: number | null;
}): number | null {
  const raw = chunk.publication_slot_id ?? chunk.publication_slot_content_id;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}
