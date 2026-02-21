"use client";

import { FC, Suspense, useEffect, useState } from "react";
import Link from "next/link";

import ArticleMiniature from "./article_components/ArticleMiniature";
import ArticleFilter from "./article_components/ArticleFilter";
import { ArticleService } from "@/app/service/ArticleService";

interface ArticlesProps {}

const Articles: FC<ArticlesProps> = ({}) => {
  const [allArticles, setAllArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArticles = async () => {
    try {
      // Fetch all articles from the API (includes JSON and dynamically created ones)
      const apiArticles = await ArticleService.getAllArticles();
      
      // Filtrar y normalizar artículos válidos
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
  }, []);

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

      <Suspense fallback={<div className='px-36 mx-7'><div className='flex flex-col border border-gray-100 shadow-xl text-center py-2 text-xs'><p>Loading filter...</p></div></div>}>
        <ArticleFilter />
      </Suspense>

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
};

export default Articles;
