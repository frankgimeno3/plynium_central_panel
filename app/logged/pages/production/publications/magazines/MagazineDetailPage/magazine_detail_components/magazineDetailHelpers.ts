import type { MagazineIssue } from "@/app/contents/interfaces";
import type { PublicationRow } from "./types";

export function normalizeStatus(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

export function isPlannableStatus(s: string) {
  const n = normalizeStatus(s);
  return n === "draft" || n === "planned";
}

export function isExpiredTabStatus(s: string) {
  const n = normalizeStatus(s);
  return n === "published" || n === "cancelled";
}

export function apiRowToIssue(p: PublicationRow): MagazineIssue {
  const fmt = String(p.publication_format || "flipbook").toLowerCase();
  const publication_format =
    fmt === "informer" || fmt === "flipbook" || fmt === "both" ? (fmt as "informer" | "flipbook" | "both") : "flipbook";
  return {
    publication_id: p.id_publication,
    issue_number: p.magazine_this_year_issue ?? 1,
    forecasted_publication_month: p.publication_expected_publication_month ?? undefined,
    is_special_edition: Boolean(p.is_special_edition),
    special_topic: p.publication_theme ?? "",
    publication_format,
  };
}
