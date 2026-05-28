export function chunkEditorDomMatches(el: HTMLElement, incoming: string): boolean {
  const normalized = incoming || "";
  if (el.innerHTML === normalized) return true;
  return normalized === "" && el.innerHTML.replace(/<br\s*\/?>/gi, "").trim() === "";
}
