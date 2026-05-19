import { ISSUE_CONTENTS_MANAGER_SUBTAB_QUERY_PARAM } from "@/app/logged/pages/production/publications/issues/[id_publication]/_tabs/ContentsManagerTab";

/** Return path from Article Builder to issue Publication Contents Manager → Publication Selected Contents. */
export function issuePublicationSelectedContentsHref(idPublication: string): string {
  const base = `/logged/pages/production/publications/issues/${encodeURIComponent(idPublication)}`;
  const q = new URLSearchParams({
    tab: "contentsManager",
    [ISSUE_CONTENTS_MANAGER_SUBTAB_QUERY_PARAM]: "selected_contents",
  });
  return `${base}?${q.toString()}`;
}
