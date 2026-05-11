"use client";

import React, { FC } from "react";
import { ArticleRelatePhase1 } from "./ArticleRelatePhase1";
import { ArticleRelatePhase2 } from "./ArticleRelatePhase2";
import { ArticleRelatePhase3 } from "./ArticleRelatePhase3";
import type {
  ArticleFilterState,
  ArticleRelateRow,
  CompanyRow,
  PortalRow,
} from "./types";

export type ArticleRelateModalContentProps = {
  phase: 1 | 2 | 3;
  onClose: () => void;
  error: string | null;
  selectedPortal: PortalRow | null;
  selectedCompany: CompanyRow | null;
  portals: PortalRow[];
  selectedPortalId: number | null;
  setSelectedPortalId: (id: number | null) => void;
  loading: boolean;
  loadCompaniesForPortal: () => void;
  companyFilter: { id: string; name: string };
  setCompanyFilter: React.Dispatch<React.SetStateAction<{ id: string; name: string }>>;
  filteredCompanies: CompanyRow[];
  loadArticlesForCompany: (company: CompanyRow) => Promise<void>;
  setPhase: (p: 1 | 2 | 3) => void;
  articleFilter: ArticleFilterState;
  setArticleFilter: React.Dispatch<React.SetStateAction<ArticleFilterState>>;
  filteredArticles: ArticleRelateRow[];
  selectedArticle: ArticleRelateRow | null;
  setSelectedArticle: (a: ArticleRelateRow | null) => void;
  onSelectArticle: (article: ArticleRelateRow) => void;
  currentArticleId?: string | null;
};

export const ArticleRelateModalContent: FC<ArticleRelateModalContentProps> = ({
  phase,
  onClose,
  error,
  selectedPortal,
  selectedCompany,
  portals,
  selectedPortalId,
  setSelectedPortalId,
  loading,
  loadCompaniesForPortal,
  companyFilter,
  setCompanyFilter,
  filteredCompanies,
  loadArticlesForCompany,
  setPhase,
  articleFilter,
  setArticleFilter,
  filteredArticles,
  selectedArticle,
  setSelectedArticle,
  onSelectArticle,
  currentArticleId,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-relate-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 id="article-relate-modal-title" className="text-xl font-bold text-gray-800">
              Relate to article
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Phase {phase} of 3
              {selectedPortal ? ` · ${selectedPortal.name}` : ""}
              {selectedCompany ? ` · ${selectedCompany.commercialName}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {phase === 1 ? (
            <ArticleRelatePhase1
              portals={portals}
              selectedPortalId={selectedPortalId}
              onChangePortalId={setSelectedPortalId}
              loading={loading}
              onContinue={() => void loadCompaniesForPortal()}
            />
          ) : null}

          {phase === 2 ? (
            <ArticleRelatePhase2
              companyFilter={companyFilter}
              onCompanyFilterChange={setCompanyFilter}
              filteredCompanies={filteredCompanies}
              onPickCompany={loadArticlesForCompany}
              onBack={() => setPhase(1)}
              onCancel={onClose}
            />
          ) : null}

          {phase === 3 ? (
            <ArticleRelatePhase3
              articleFilter={articleFilter}
              onArticleFilterChange={setArticleFilter}
              filteredArticles={filteredArticles}
              selectedArticle={selectedArticle}
              onSelectArticleRow={setSelectedArticle}
              onBack={() => setPhase(2)}
              onCancel={onClose}
              onRelate={() => selectedArticle && onSelectArticle(selectedArticle)}
              currentArticleId={currentArticleId}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
