"use client";

import type { ArticlePublication } from "../hooks/useArticlePage";

const VISIBILITY_OPTIONS: { value: string; label: string }[] = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "unlisted", label: "Unlisted" },
];

type Props = {
  publications: ArticlePublication[];
  allPortals: { id: number; name: string }[];
  isPortalActionLoading: boolean;
  onAddToPortal: (portalId: number) => void;
  onRemoveFromPortal: (portalId: number) => void;
  onUpdatePublication: (
    portalId: number,
    updates: { visibility?: string; commentingEnabled?: boolean }
  ) => void;
};

function visibilityLabel(visibility: string | undefined) {
  const v = visibility ?? "public";
  const opt = VISIBILITY_OPTIONS.find((o) => o.value === v);
  return opt ? opt.label : v;
}

export default function ArticlePublicationPortalsSection({
  publications,
  allPortals,
  isPortalActionLoading,
  onAddToPortal,
  onRemoveFromPortal,
  onUpdatePublication,
}: Props) {
  const availableToAdd = allPortals.filter((p) => !publications.some((pub) => pub.portalId === p.id));

  return (
    <div className="flex flex-col gap-2">
      <label className="text-lg font-bold text-gray-800">Published in portals</label>
      <p className="text-sm text-gray-500">
        Open a portal to change visibility, commenting, or remove the article from that portal.
      </p>
      <div className="flex flex-col gap-2">
        {publications.length === 0 ? (
          <p className="text-sm text-gray-400">Not published in any portal yet.</p>
        ) : (
          <ul className="list-none flex flex-col gap-2">
            {publications.map((pub) => {
              const vis = pub.visibility ?? "public";
              const commentingOn = pub.commentingEnabled !== false;
              const knownVisibility = VISIBILITY_OPTIONS.some((o) => o.value === vis);

              return (
                <li key={pub.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <details className="group">
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-sm [&::-webkit-details-marker]:hidden">
                      <span className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="font-medium text-gray-800">{pub.portalName}</span>
                        <span className="text-xs font-normal text-gray-500">
                          {visibilityLabel(vis)} · {commentingOn ? "Comments on" : "Comments off"}
                        </span>
                      </span>
                      <span className="text-gray-400 text-xs shrink-0 group-open:rotate-180 transition-transform">
                        ▼
                      </span>
                    </summary>
                    <div className="px-3 py-3 flex flex-col gap-3 border-t border-gray-100">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-600" htmlFor={`vis-${pub.id}`}>
                          Visibility
                        </label>
                        <select
                          id={`vis-${pub.id}`}
                          value={vis}
                          onChange={(e) => onUpdatePublication(pub.portalId, { visibility: e.target.value })}
                          disabled={isPortalActionLoading}
                          className="w-full max-w-xs px-3 py-2 border rounded-xl bg-white text-gray-700 text-sm disabled:opacity-50"
                        >
                          {!knownVisibility && (
                            <option value={vis}>
                              {vis} (current)
                            </option>
                          )}
                          {VISIBILITY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={commentingOn}
                          onChange={(e) =>
                            onUpdatePublication(pub.portalId, { commentingEnabled: e.target.checked })
                          }
                          disabled={isPortalActionLoading}
                          className="rounded border-gray-300 text-blue-950 focus:ring-blue-950 disabled:opacity-50"
                        />
                        <span>Commenting enabled</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => onRemoveFromPortal(pub.portalId)}
                        disabled={isPortalActionLoading}
                        className="self-start text-sm text-red-600 hover:text-red-800 disabled:opacity-50 font-medium"
                      >
                        Remove from this portal
                      </button>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
        {availableToAdd.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <select
              id="add-portal-select"
              disabled={isPortalActionLoading}
              className="px-3 py-2 border rounded-xl bg-white text-gray-700 text-sm disabled:opacity-50 max-w-xs"
              defaultValue=""
            >
              <option value="">Select portal to add…</option>
              {availableToAdd.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isPortalActionLoading}
              onClick={() => {
                const sel = document.getElementById("add-portal-select") as HTMLSelectElement;
                const portalId = sel?.value ? Number(sel.value) : 0;
                if (portalId) {
                  onAddToPortal(portalId);
                  sel.value = "";
                }
              }}
              className="px-3 py-2 text-xs rounded-xl bg-blue-950 text-white hover:bg-blue-950/90 disabled:opacity-50"
            >
              {isPortalActionLoading ? "…" : "Add to portal"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
