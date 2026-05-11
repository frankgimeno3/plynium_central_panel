import type { MovableContentType } from "./types";

export function readableLabel(contentType: MovableContentType): string {
  return contentType === "summary" ? "Summary" : "Index";
}
