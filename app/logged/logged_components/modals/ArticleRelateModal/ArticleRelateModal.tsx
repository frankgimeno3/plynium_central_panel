"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { ArticleRelateModalShell } from "./modal_article_relate_components/ArticleRelateModalShell";
import { ArticleRelatePhase1 } from "./modal_article_relate_components/ArticleRelatePhase1";
import { ArticleRelatePhase2 } from "./modal_article_relate_components/ArticleRelatePhase2";
import { ArticleRelatePhase3 } from "./modal_article_relate_components/ArticleRelatePhase3";
import { EMPTY_DATE_PARTS, datePartsEmpty, partsToIso } from "./modal_article_relate_components/date_helpers";
import type { ArticleRelateRow, ArticleFilterState, CompanyRow, PortalRow } from "./modal_article_relate_components/types";

export type { ArticleRelateRow } from "./modal_article_relate_components/types";

interface ArticleRelateModalProps {
  open: boolean;
  onClose: () => void;
  onSelectArticle: (article: ArticleRelateRow) => void;
  currentArticleId?: string | null;
}

const ArticleRelateModal: FC<ArticleRelateModalProps> = ({
  open,
  onClose,
  onSelectArticle,
  currentArticleId = null,
}) => {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [portals, setPortals] = useState<PortalRow[]>([]);
  const [selectedPortalId, setSelectedPortalId] = useState<number | null>(null);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyRow | null>(null);
  const [articles, setArticles] = useState<ArticleRelateRow[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<ArticleRelateRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState({ id: "", name: "" });
  const [articleFilter, setArticleFilter] = useState<ArticleFilterState>({
    id: "",
    title: "",
    from: EMPTY_DATE_PARTS,
    to: EMPTY_DATE_PARTS,
  });

  const selectedPortal = useMemo(
    () => portals.find((p) => Number(p.id) === Number(selectedPortalId)) ?? null,
    [portals, selectedPortalId]
  );

  const reset = useCallback(() => {
    setPhase(1);
    setSelectedPortalId(null);
    setCompanies([]);
    setSelectedCompany(null);
    setArticles([]);
    setSelectedArticle(null);
    setError(null);
    setCompanyFilter({ id: "", name: "" });
    setArticleFilter({ id: "", title: "", from: EMPTY_DATE_PARTS, to: EMPTY_DATE_PARTS });
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    let cancelled = false;
    async function loadPortals() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/v1/portals", { cache: "no-store", credentials: "include" });
        if (!res.ok) throw new Error("Failed to load portals");
        const data = (await res.json()) as PortalRow[];
        if (!cancelled) setPortals(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        if (!cancelled) setError((e as Error)?.message ?? "Failed to load portals");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadPortals();
    return () => {
      cancelled = true;
    };
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const loadCompaniesForPortal = useCallback(async () => {
    if (!selectedPortalId) return;
    setLoading(true);
    setError(null);
    setSelectedCompany(null);
    try {
      const res = await fetch(`/api/v1/portals/${selectedPortalId}/companies`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load companies for portal");
      const data = (await res.json()) as CompanyRow[];
      setCompanies(Array.isArray(data) ? data : []);
      setPhase(2);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Failed to load companies for portal");
    } finally {
      setLoading(false);
    }
  }, [selectedPortalId]);

  const loadArticlesForCompany = useCallback(
    async (company: CompanyRow) => {
      if (!selectedPortal?.name) return;
      setLoading(true);
      setError(null);
      setSelectedArticle(null);
      try {
        const qs = new URLSearchParams({ portalNames: selectedPortal.name });
        const res = await fetch(`/api/v1/articles?${qs.toString()}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load articles");
        const data = (await res.json()) as ArticleRelateRow[];
        const companyId = String(company.companyId).toLowerCase();
        const companyName = String(company.commercialName).toLowerCase();
        setArticles(
          (Array.isArray(data) ? data : []).filter((article) => {
            const ids = Array.isArray(article.article_company_id_array)
              ? article.article_company_id_array.map((id) => String(id).toLowerCase())
              : [];
            const names = Array.isArray(article.article_company_names_array)
              ? article.article_company_names_array.map((name) => String(name).toLowerCase())
              : [];
            return ids.includes(companyId) || names.includes(companyName);
          })
        );
        setSelectedCompany(company);
        setPhase(3);
      } catch (e: unknown) {
        setError((e as Error)?.message ?? "Failed to load articles");
      } finally {
        setLoading(false);
      }
    },
    [selectedPortal?.name]
  );

  const filteredCompanies = useMemo(() => {
    const id = companyFilter.id.trim().toLowerCase();
    const name = companyFilter.name.trim().toLowerCase();
    return companies.filter((company) => {
      if (id && !String(company.companyId).toLowerCase().includes(id)) return false;
      if (name && !String(company.commercialName).toLowerCase().includes(name)) return false;
      return true;
    });
  }, [companies, companyFilter]);

  const filteredArticles = useMemo(() => {
    const id = articleFilter.id.trim().toLowerCase();
    const title = articleFilter.title.trim().toLowerCase();
    const fromIso = datePartsEmpty(articleFilter.from) ? null : partsToIso(articleFilter.from);
    const toIso = datePartsEmpty(articleFilter.to) ? null : partsToIso(articleFilter.to, true);
    return articles.filter((article) => {
      if (id && !String(article.id_article).toLowerCase().includes(id)) return false;
      if (title && !String(article.articleTitle).toLowerCase().includes(title)) return false;
      const articleDate = article.date ? new Date(article.date).toISOString() : "";
      if (fromIso && (!articleDate || articleDate < fromIso)) return false;
      if (toIso && (!articleDate || articleDate > toIso)) return false;
      return true;
    });
  }, [articles, articleFilter]);

  if (!open) return null;

  const subtitle = `Phase ${phase} of 3${selectedPortal ? ` · ${selectedPortal.name}` : ""}${selectedCompany ? ` · ${selectedCompany.commercialName}` : ""}`;

  return (
    <ArticleRelateModalShell subtitle={subtitle} onBackdropClose={onClose} error={error}>
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
          onPickCompany={(c) => void loadArticlesForCompany(c)}
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
          currentArticleId={currentArticleId}
          onRelate={() => selectedArticle && onSelectArticle(selectedArticle)}
        />
      ) : null}
    </ArticleRelateModalShell>
  );
};

export default ArticleRelateModal;
