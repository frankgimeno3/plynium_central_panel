"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import {
    BASE,
    type PublicationDbRow,
    type SlotRow,
} from "@/app/logged/pages/production/publications/publication_components/_shared";
import {
    buildMagazinePreviewSpreads,
    findSpreadByLabel,
    magazinePreviewPageLabel,
    type MagazinePreviewSpread,
} from "./buildMagazinePreviewSpreads";
import { MagazinePreviewPageCard } from "./MagazinePreviewPageCard";

type MagazinePreviewClientProps = {
    publicationId: string;
    pageToken: string;
};

function previewHref(publicationId: string, label: string): string {
    return `${BASE}/${encodeURIComponent(publicationId)}/preview/${encodeURIComponent(label)}`;
}

function issueHref(publicationId: string): string {
    return `${BASE}/${encodeURIComponent(publicationId)}`;
}

/**
 * Reads the publication + its flatplan slots from the same endpoints the issue
 * detail page uses, splits them into 2-page spreads, and renders the spread
 * matching the URL token (right page's `publication_page`, or "0" for cover).
 */
export const MagazinePreviewClient: FC<MagazinePreviewClientProps> = ({
    publicationId,
    pageToken,
}) => {
    const router = useRouter();
    const { setPageMeta } = usePageContent();
    const [publication, setPublication] = useState<PublicationDbRow | null>(null);
    const [slots, setSlots] = useState<SlotRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        (async () => {
            try {
                const [pubRes, slotsRes] = await Promise.all([
                    fetch(`/api/v1/publications-db/${encodeURIComponent(publicationId)}`, {
                        cache: "no-store",
                        credentials: "include",
                    }),
                    fetch(`/api/v1/publications-db/${encodeURIComponent(publicationId)}/slots`, {
                        cache: "no-store",
                        credentials: "include",
                    }),
                ]);
                if (cancelled) return;
                if (!pubRes.ok) throw new Error("Failed to load publication");
                const pub = (await pubRes.json()) as PublicationDbRow;
                const rawSlots = slotsRes.ok ? ((await slotsRes.json()) as unknown[]) : [];
                const slotList = (Array.isArray(rawSlots) ? rawSlots : []).map((raw) => {
                    const s = raw as Record<string, unknown>;
                    const publication_page =
                        s.publication_page != null && Number.isFinite(Number(s.publication_page))
                            ? Number(s.publication_page)
                            : 0;
                    const slot_ordinal =
                        s.slot_ordinal != null && Number.isFinite(Number(s.slot_ordinal))
                            ? Number(s.slot_ordinal)
                            : publication_page + 1;
                    return { ...s, publication_page, slot_ordinal } as SlotRow;
                });
                if (cancelled) return;
                setPublication(pub);
                setSlots(slotList);
            } catch (e: unknown) {
                if (cancelled) return;
                setPublication(null);
                setSlots([]);
                setError(e instanceof Error ? e.message : "Failed to load magazine preview");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [publicationId]);

    const spreads: MagazinePreviewSpread[] = useMemo(
        () => buildMagazinePreviewSpreads(slots),
        [slots]
    );

    const currentSpread = useMemo(
        () => findSpreadByLabel(spreads, pageToken),
        [spreads, pageToken]
    );

    const fallbackSpread = useMemo(
        () => (spreads.length > 0 ? spreads[0] : null),
        [spreads]
    );

    // If the URL token doesn't match any spread (e.g. invalid page), redirect to
    // the first spread once data has loaded. Avoids a black page on bad URLs.
    useEffect(() => {
        if (loading || !fallbackSpread || currentSpread) return;
        const target = fallbackSpread.label;
        if (target === pageToken) return;
        router.replace(previewHref(publicationId, target));
    }, [loading, fallbackSpread, currentSpread, pageToken, publicationId, router]);

    const prevSpread = useMemo(() => {
        if (!currentSpread) return null;
        const idx = currentSpread.index;
        return idx > 0 ? spreads[idx - 1] : null;
    }, [currentSpread, spreads]);

    const nextSpread = useMemo(() => {
        if (!currentSpread) return null;
        const idx = currentSpread.index;
        return idx + 1 < spreads.length ? spreads[idx + 1] : null;
    }, [currentSpread, spreads]);

    const goToSpread = useCallback(
        (target: MagazinePreviewSpread | null) => {
            if (!target) return;
            router.push(previewHref(publicationId, target.label));
        },
        [publicationId, router]
    );

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented) return;
            if (event.metaKey || event.ctrlKey || event.altKey) return;
            if (event.key === "ArrowLeft" && prevSpread) {
                event.preventDefault();
                goToSpread(prevSpread);
            } else if (event.key === "ArrowRight" && nextSpread) {
                event.preventDefault();
                goToSpread(nextSpread);
            } else if (event.key === "Escape") {
                event.preventDefault();
                router.push(issueHref(publicationId));
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [goToSpread, prevSpread, nextSpread, publicationId, router]);

    const title =
        publication?.publication_edition_name?.trim() ||
        `Publication ${publicationId}`;

    useEffect(() => {
        setPageMeta({
            pageTitle: title,
            breadcrumbs: [
                { label: "Production", href: "/logged/pages/production/services" },
                { label: "Publications", href: BASE },
                { label: "Issues", href: BASE },
                { label: title, href: issueHref(publicationId) },
                { label: "Preview" },
            ],
            buttons: [{ label: "Back to issue", href: issueHref(publicationId) }],
        });
    }, [publicationId, setPageMeta, title]);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">
                Loading magazine preview…
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-2xl space-y-3 p-6">
                <h1 className="text-lg font-semibold text-red-700">Magazine preview unavailable</h1>
                <p className="text-sm text-gray-700">{error}</p>
                <Link
                    href={issueHref(publicationId)}
                    className="inline-flex items-center rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                    ← Back to issue
                </Link>
            </div>
        );
    }

    if (spreads.length === 0) {
        return (
            <div className="mx-auto max-w-2xl space-y-3 p-6">
                <h1 className="text-lg font-semibold text-gray-800">Nothing to preview yet</h1>
                <p className="text-sm text-gray-600">This issue has no flatplan slots yet.</p>
                <Link
                    href={issueHref(publicationId)}
                    className="inline-flex items-center rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                    ← Back to issue
                </Link>
            </div>
        );
    }

    const spread = currentSpread ?? fallbackSpread;
    if (!spread) return null;

    return (
        <div className="flex min-h-[80vh] flex-col">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-2">
                <div className="flex items-center gap-3">
                    <Link
                        href={issueHref(publicationId)}
                        className="inline-flex items-center rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                        ← Back to issue
                    </Link>
                    <span className="text-sm font-semibold text-gray-800">{title}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => goToSpread(prevSpread)}
                        disabled={!prevSpread}
                        className="inline-flex items-center rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 enabled:hover:bg-gray-50 disabled:opacity-40"
                    >
                        ← Previous
                    </button>
                    <span className="px-2 text-xs tabular-nums text-gray-600">
                        Spread {spread.index + 1} / {spread.total}
                    </span>
                    <button
                        type="button"
                        onClick={() => goToSpread(nextSpread)}
                        disabled={!nextSpread}
                        className="inline-flex items-center rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 enabled:hover:bg-gray-50 disabled:opacity-40"
                    >
                        Next →
                    </button>
                </div>
            </header>

            <div className="flex flex-1 items-center justify-center bg-neutral-900 px-4 py-6">
                <div className="flex w-full items-stretch justify-center gap-2 sm:gap-4">
                    <MagazinePreviewPageCard slot={spread.leftSlot} isLeftPage />
                    <MagazinePreviewPageCard slot={spread.rightSlot} isLeftPage={false} />
                </div>
            </div>
        </div>
    );
};
