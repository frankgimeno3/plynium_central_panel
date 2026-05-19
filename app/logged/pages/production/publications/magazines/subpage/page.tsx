import { redirect } from "next/navigation";

type MagazineSubpageRedirectProps = {
  searchParams: Promise<{
    issue?: string;
    item?: string;
    page?: string;
  }>;
};

/** Legacy magazine subpage URLs → unified Article Builder (Article editor tab). */
export default async function MagazineSubpageRedirectPage({
  searchParams,
}: MagazineSubpageRedirectProps) {
  const sp = await searchParams;
  const issue = String(sp.issue ?? "").trim();
  const item = String(sp.item ?? "").trim();
  const page = String(sp.page ?? "").trim();

  if (!issue || !item) {
    redirect("/logged/pages/production/publications/issues");
  }

  const base = `/logged/pages/production/publications/issues/${encodeURIComponent(
    issue
  )}/article_builder/${encodeURIComponent(item)}`;
  const params = new URLSearchParams({ tab: "editor" });
  if (page) params.set("page", page);
  redirect(`${base}?${params.toString()}`);
}
