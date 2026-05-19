"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ArticleContentCard from "@/app/logged/pages/network/contents/articles/[id_article]/id_article_components/ArticleContentCard";

export type PortalArticleApiShape = {
  id_article?: string;
  articleTitle?: string;
  articleSubtitle?: string | null;
  article_main_image_url?: string | null;
  contents_array?: string[];
};

export type PortalContentRow = {
  content_id: string;
  content_type: string;
  content_content: {
    left?: string;
    right?: string;
    center?: string;
  };
};

function ReadOnlyHtml({ html }: { html: string }) {
  const trimmed = String(html ?? "").trim();
  if (!trimmed) return <p className="text-sm italic text-gray-400">(empty)</p>;
  return (
    <div
      className="prose prose-sm max-w-none text-gray-800"
      dangerouslySetInnerHTML={{ __html: trimmed }}
    />
  );
}

function ReadOnlyImage({ src, label }: { src: string; label: string }) {
  const url = String(src ?? "").trim();
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="max-h-96 max-w-full rounded-lg border border-gray-200 object-contain"
        />
      ) : (
        <div className="flex h-40 max-w-md items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400">
          No image
        </div>
      )}
    </div>
  );
}

function ReadOnlyContentChunk({ content, index }: { content: PortalContentRow; index: number }) {
  const t = String(content.content_type ?? "").trim();
  const cc = content.content_content ?? {};

  let body: React.ReactNode;
  if (t === "just_text") {
    body = (
      <div>
        <span className="text-xs font-semibold text-gray-500">Text (centered)</span>
        <ReadOnlyHtml html={String(cc.center ?? "")} />
      </div>
    );
  } else if (t === "just_image") {
    body = <ReadOnlyImage src={String(cc.center ?? "")} label="Image (centered)" />;
  } else if (t === "text_image") {
    body = (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
        <div>
          <span className="text-xs font-semibold text-gray-500">Text (left)</span>
          <ReadOnlyHtml html={String(cc.left ?? "")} />
        </div>
        <ReadOnlyImage src={String(cc.right ?? "")} label="Image (right)" />
      </div>
    );
  } else if (t === "image_text") {
    body = (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
        <ReadOnlyImage src={String(cc.left ?? "")} label="Image (left)" />
        <div>
          <span className="text-xs font-semibold text-gray-500">Text (right)</span>
          <ReadOnlyHtml html={String(cc.right ?? "")} />
        </div>
      </div>
    );
  } else {
    body = (
      <pre className="max-h-64 overflow-auto rounded-md bg-amber-50 p-3 text-xs text-amber-950">
        {JSON.stringify({ content_type: t, content_content: cc }, null, 2)}
      </pre>
    );
  }

  return (
    <ArticleContentCard>
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-950">
            Chunk {index + 1}
          </span>
          <span className="rounded-full border border-gray-300 bg-white px-2 py-0.5 font-mono text-[10px] text-gray-700">
            {content.content_id}
          </span>
        </div>
        <span className="inline-flex w-fit rounded-full border border-gray-300 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-800">
          {t || "unknown_type"}
        </span>
      </div>
      <div className="pt-2">{body}</div>
    </ArticleContentCard>
  );
}

export type PortalOriginalArticlePanelProps = {
  /** When false, skips network requests (tab hidden). */
  active: boolean;
  /** `publication_articles.article_id` when linked to a portal article; null if standalone / missing. */
  portalArticleId: string | null;
};

export function PortalOriginalArticlePanel({ active, portalArticleId }: PortalOriginalArticlePanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<PortalArticleApiShape | null>(null);
  const [orderedContents, setOrderedContents] = useState<PortalContentRow[]>([]);

  useEffect(() => {
    if (!active || !portalArticleId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setArticle(null);
      setOrderedContents([]);
      try {
        const [aRes, cRes] = await Promise.all([
          fetch(`/api/v1/articles/${encodeURIComponent(portalArticleId)}`, {
            cache: "no-store",
            credentials: "include",
          }),
          fetch(`/api/v1/contents`, { cache: "no-store", credentials: "include" }),
        ]);
        if (!aRes.ok) {
          const txt = await aRes.text().catch(() => "");
          throw new Error(txt || "Failed to load portal article");
        }
        if (!cRes.ok) {
          const txt = await cRes.text().catch(() => "");
          throw new Error(txt || "Failed to load contents catalog");
        }
        const art = (await aRes.json()) as PortalArticleApiShape;
        const allContents = (await cRes.json()) as PortalContentRow[];
        const ids = Array.isArray(art.contents_array) ? art.contents_array.map(String) : [];
        const byId = new Map<string, PortalContentRow>();
        for (const c of Array.isArray(allContents) ? allContents : []) {
          if (c?.content_id) byId.set(String(c.content_id), c);
        }
        const ordered: PortalContentRow[] = [];
        for (const id of ids) {
          const row = byId.get(id);
          if (row) ordered.push(row);
        }
        if (!cancelled) {
          setArticle(art);
          setOrderedContents(ordered);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load original article");
          setArticle(null);
          setOrderedContents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, portalArticleId]);

  const networkArticleHref = useMemo(() => {
    if (!portalArticleId) return null;
    return `/logged/pages/network/contents/articles/${encodeURIComponent(portalArticleId)}`;
  }, [portalArticleId]);

  if (!portalArticleId) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <p className="text-sm font-medium text-gray-800">
          This magazine article is not linked to any portal article.
        </p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-gray-600">
          Standalone publication articles (created from scratch in Publication Contents Manager) only exist in this issue.
          There is no published portal source to compare against.
        </p>
      </div>
    );
  }

  if (!active) {
    return null;
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Loading portal article…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          {article?.article_main_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.article_main_image_url}
              alt=""
              className="h-24 w-36 shrink-0 rounded-lg border border-gray-200 object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-gray-500">{portalArticleId}</p>
            <h2 className="text-lg font-semibold text-gray-900">
              {article?.articleTitle ?? portalArticleId}
            </h2>
            {article?.articleSubtitle ? (
              <p className="mt-1 text-sm text-gray-600">{article.articleSubtitle}</p>
            ) : null}
          </div>
        </div>
        {networkArticleHref ? (
          <Link
            href={networkArticleHref}
            className="shrink-0 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-100"
          >
            Open in Network → Articles (editable)
          </Link>
        ) : null}
      </div>

      <p className="text-sm text-gray-600">
        Content blocks from the portal article, in order. This view is read-only; editors are disabled here.
      </p>

      {orderedContents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
          No content chunks are linked to this portal article (
          <span className="font-mono text-xs">{portalArticleId}</span>
          ).
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {orderedContents.map((c, idx) => (
            <ReadOnlyContentChunk key={c.content_id} content={c} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
