"use client";

import { FC, use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { BASE } from "@/app/logged/pages/production/publications/publication_components/_shared";
import { ISSUE_CONTENTS_MANAGER_SUBTAB_QUERY_PARAM } from "@/app/logged/pages/production/publications/issues/[id_publication]/_tabs/ContentsManagerTab";

function selectedContentsHref(publicationId: string): string {
  const root = `${BASE}/${encodeURIComponent(publicationId)}`;
  const q = new URLSearchParams({
    tab: "contentsManager",
    [ISSUE_CONTENTS_MANAGER_SUBTAB_QUERY_PARAM]: "selected_contents",
  });
  return `${root}?${q.toString()}`;
}

const NewPublicationArticlePage: FC<{
  params: Promise<{ id_publication: string }>;
}> = ({ params }) => {
  const { id_publication } = use(params);
  const router = useRouter();
  const [desiredPages, setDesiredPages] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/publications/${encodeURIComponent(id_publication)}/publication-articles`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            standalone: true,
            desired_page_count: desiredPages,
          }),
        }
      );
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        let msg = t || "Failed to create publication article";
        try {
          const j = JSON.parse(t) as { message?: string };
          if (j?.message) msg = String(j.message);
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      router.replace(selectedContentsHref(id_publication));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContentSection>
      <div className="mx-auto max-w-lg space-y-6 p-6">
        <Link
          href={selectedContentsHref(id_publication)}
          className="text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline"
        >
          ← Back to selected contents
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Create new magazine article</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            You are creating a new publication article from scratch — it is not linked to any portal
            article yet. Choose how many magazine pages this article should span, then continue.
            You will assign editorial slots from{" "}
            <span className="font-medium text-gray-800">
              Publication Contents Manager → Publication Selected Contents
            </span>{" "}
            and open the Article Builder when you are ready.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Desired magazine pages
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={desiredPages}
            onChange={(e) => setDesiredPages(Math.max(1, Number(e.target.value) || 1))}
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-2 text-xs text-gray-500">
            Changing page count later (in Article Builder) updates how many slots this article needs;
            you may need to re-run slot provisioning afterward.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleCreate()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Creating…" : "Continue"}
          </button>
          <Link
            href={selectedContentsHref(id_publication)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </div>
    </PageContentSection>
  );
};

export default NewPublicationArticlePage;
