"use client";

import React, { FC } from "react";
import {
  PUBLICATION_ARTICLE_STATE_HELP,
  PUBLICATION_ARTICLE_STATE_VALUES,
  isPublicationArticleStateValue,
  type PublicationArticleStateValue,
} from "@/app/logged/pages/production/publications/publication_components/_shared";

type ArticleBuilderWorkflowStateSectionProps = {
  publicationArticleState: string | undefined;
  articleStateSaving: boolean;
  onStateChange: (next: string) => void;
};

export const ArticleBuilderWorkflowStateSection: FC<ArticleBuilderWorkflowStateSectionProps> = ({
  publicationArticleState,
  articleStateSaving,
  onStateChange,
}) => {
  const current = isPublicationArticleStateValue(String(publicationArticleState ?? "").trim())
    ? (String(publicationArticleState).trim() as PublicationArticleStateValue)
    : "unfinished";

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/90 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
        <div className="flex min-w-0 shrink-0 flex-col gap-3 lg:max-w-sm">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Article workflow state</h2>
            <p className="mt-1 text-xs text-slate-600">
              Shared across every magazine page of this adaptation. It appears on the issue flatplan
              and must be <strong>finished approved</strong> on every article slot before the issue can
              be published.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="publication-article-state" className="sr-only">
              Workflow state
            </label>
            <select
              id="publication-article-state"
              className="min-w-[14rem] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={articleStateSaving}
              value={current}
              onChange={(e) => onStateChange(e.target.value)}
            >
              {PUBLICATION_ARTICLE_STATE_VALUES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            {articleStateSaving ? (
              <span className="text-xs text-slate-500">Saving…</span>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-row flex-wrap gap-3">
          {PUBLICATION_ARTICLE_STATE_VALUES.map((v) => {
            const isActive = v === current;
            return (
              <div
                key={v}
                className={`flex min-w-[9.5rem] flex-1 flex-col gap-1.5 rounded-lg border p-3 ${
                  isActive
                    ? "border-blue-400 bg-blue-50/80 ring-1 ring-blue-200"
                    : "border-slate-200 bg-white"
                }`}
              >
                <p className="text-xs font-bold leading-tight text-slate-900">{v}</p>
                <p className="text-[11px] leading-snug text-slate-600">{PUBLICATION_ARTICLE_STATE_HELP[v]}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
