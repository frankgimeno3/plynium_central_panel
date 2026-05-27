/**
 * Marks chunks whose `contentEditable` DOM must be updated from React props even
 * while focused (e.g. grid overflow trim / spill into the next cell).
 */
const forcedDomSyncChunkIds = new Set<string>();

export function requestChunkEditorDomSync(chunkId: string): void {
  const id = String(chunkId ?? "").trim();
  if (id) forcedDomSyncChunkIds.add(id);
}

/** Returns true once per request; consumed when the editor applies props → DOM. */
export function consumeChunkEditorDomSync(chunkId: string): boolean {
  const id = String(chunkId ?? "").trim();
  if (!id || !forcedDomSyncChunkIds.has(id)) return false;
  forcedDomSyncChunkIds.delete(id);
  return true;
}

export function requestChunkEditorDomSyncForChunks(chunkIds: Iterable<string>): void {
  for (const chunkId of chunkIds) {
    requestChunkEditorDomSync(chunkId);
  }
}
