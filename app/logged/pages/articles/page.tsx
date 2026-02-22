"use client";

import { FC, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import ArticleMiniature from "./article_components/ArticleMiniature";
import ArticleFilter from "./article_components/ArticleFilter";
import { ArticleService } from "@/app/service/ArticleService";

interface ArticlesContentProps {}

const ArticlesContent: FC<ArticlesContentProps> = ({}) => {
  const searchParams = useSearchParams();
  const portalNamesParam = searchParams.get("portalNames") ?? "";
  const portalNames = portalNamesParam ? portalNamesParam.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const [allArticles, setAllArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArticles = async () => {
    try {
      const apiArticles = await ArticleService.getAllArticles(
        portalNames.length > 0 ? { portalNames } : {}
      );
      const validArticles = Array.isArray(apiArticles)
        ? apiArticles.filter((art: any) => art && art.id_article && art.articleTitle)
        : [];
      setAllArticles(validArticles);
    } catch (error: unknown) {
      const msg =
        typeof error === "string"
          ? error
          : (error as { message?: string })?.message ||
            (error as { data?: { message?: string } })?.data?.message ||
            ((error as { status?: number })?.status != null
              ? `HTTP ${(error as { status?: number }).status}`
              : "Unknown error");
      console.error("Error fetching articles:", msg, error);
      setAllArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [portalNamesParam]);

  return (
    <div className="flex flex-col w-full bg-white">
      <div className="flex flex-col text-center bg-blue-950/70 p-5 px-46 text-white">
        <p className="text-2xl">All articles</p>
        <Link
          href="/logged/pages/articles/create"
          className="bg-blue-950 text-white text-xs px-4 py-1 rounded-xl shadow cursor-pointer w-26 mx-auto mt-2 hover:bg-blue-950/80 inline-block"
        >
          Create article
        </Link>
      </div>

      <ArticleFilter selectedPortalNames={portalNames} />

      <div className="flex flex-wrap py-5 gap-12 justify-center ">
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading articles...</p>
          </div>
        ) : allArticles.filter((a: any) => a && a.id_article && a.articleTitle).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 w-full">
            <p className="text-gray-500 text-lg">No results found for your query</p>
          </div>
        ) : (
          allArticles
            .filter((a: any) => a && a.id_article && a.articleTitle)
            .map((a: any, index: number) => (
              <ArticleMiniature
                key={a.id_article || index}
                id_article={a.id_article || ""}
                titulo={a.articleTitle || ""}
                company={a.company || ""}
                date={a.date || ""}
                imageUrl={a.article_main_image_url || ""}
              />
            ))
        )}
      </div>
    </div>
  );
}

const Articles: FC = () => (
  <Suspense fallback={<div className="flex flex-col w-full bg-white min-h-[200px] items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
    <ArticlesContent />
  </Suspense>
);

export default Articles;
