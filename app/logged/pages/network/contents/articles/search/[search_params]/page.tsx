"use client";

import { FC, useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { usePageContent } from '@/app/logged/logged_components/PageContentContext';
import PageContentSection from '@/app/logged/logged_components/PageContentSection';
import ArticleMiniature from '../../article_components/ArticleMiniature';
import ArticleFilter from '../../article_components/ArticleFilter';
import { ArticleService } from '@/app/service/ArticleService';

type FilterType = 'date' | 'title' | 'company';

const isFilterType = (value: string): value is FilterType => {
  return value === 'date' || value === 'title' || value === 'company';
};

const formatDateForDisplay = (raw: string): string => {
  if (!raw) return '';
  const parts = raw.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return raw;
};

interface Article {
  id_article: string;
  articleTitle: string;
  articleSubtitle: string;
  article_main_image_url: string;
  company: string;
  date: string;
  article_tags_array: string[];
  contents_array: string[];
  highlightByPortal?: { portalName: string; highlightPosition: string }[];
}

interface PageProps {
  params: {
    search_params: string;
  };
}

const ArticleSearchResultsContent: FC = () => {
  const params = useParams();
  const searchParams = params?.search_params as string;
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<FilterType | null>(null);
  const [value, setValue] = useState<string>('');
  const [heading, setHeading] = useState<string>('Results');

  useEffect(() => {
    const loadAndFilterArticles = async () => {
      try {
        setLoading(true);
        
        // Parse search params
        const decoded = decodeURIComponent(searchParams ?? '');
        const [rawType, ...rest] = decoded.split('__');
        const filterType: FilterType | null = isFilterType(rawType) ? rawType : null;
        const filterValue = rest.join('__');

        setType(filterType);
        setValue(filterValue);

        // Build heading
        let headingText = 'Results';
        if (filterType === 'date') {
          headingText = `Articles for date ${formatDateForDisplay(filterValue)}`;
        } else if (filterType === 'title') {
          headingText = `Articles matching "${filterValue}"`;
        } else if (filterType === 'company') {
          headingText = `Articles related to company ${filterValue}`;
        }
        setHeading(headingText);

        // Get all articles from API
        const apiArticles = await ArticleService.getAllArticles({ withHighlightInfo: true });
        const allArticles = Array.isArray(apiArticles) 
          ? apiArticles.filter((art: any) => art && art.id_article && art.articleTitle)
          : [];

        // Filter articles based on search params
        const filtered = allArticles.filter((a: Article) => {
          if (!filterType) return true;
          if (!filterValue) return true;

          if (filterType === 'date') {
            return a.date === filterValue;
          }

          if (filterType === 'company') {
            return a.company?.toLowerCase().includes(filterValue.toLowerCase());
          }

          if (filterType === 'title') {
            return a.articleTitle?.toLowerCase().includes(filterValue.toLowerCase());
          }

          return true;
        });

        setFilteredArticles(filtered);
      } catch (error) {
        console.error("Error loading and filtering articles:", error);
        setFilteredArticles([]);
      } finally {
        setLoading(false);
      }
    };

    if (searchParams) {
      loadAndFilterArticles();
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const breadcrumbs = [
    { label: "Contents", href: "/logged/pages/network/contents/articles" },
    { label: "Articles", href: "/logged/pages/network/contents/articles" },
    { label: "Search results" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: loading ? "Loading..." : heading,
      breadcrumbs,
    });
  }, [setPageMeta, loading, heading, breadcrumbs]);

  if (loading) {
    return (
      <>
        <PageContentSection><p className="text-gray-500">Loading...</p></PageContentSection>
      </>
    );
  }

  return (
    <>
      <PageContentSection>
        <ArticleFilter />
      </PageContentSection>
      <PageContentSection>
      <div className='flex flex-col py-5 gap-12 mx-auto'>
        <div className='flex flex-row gap-5 flex-wrap'>
          {filteredArticles.length > 0 ? (
            filteredArticles.map((a) => (
              <ArticleMiniature
                key={a.id_article}
                id_article={a.id_article}
                titulo={a.articleTitle}
                company={a.company}
                date={a.date}
                imageUrl={a.article_main_image_url || ""}
                highlightByPortal={a.highlightByPortal || []}
              />
            ))
          ) : (
            <div className='flex flex-col items-center justify-center py-12 w-full'>
              <p className='text-gray-500 text-lg'>No results found for your query</p>
            </div>
          )}
        </div>
      </div>
      </PageContentSection>
    </>
  );
};

const ArticleSearchFallback: FC = () => {
  const { setPageMeta } = usePageContent();
  const breadcrumbs = [
    { label: "Contents", href: "/logged/pages/network/contents/articles" },
    { label: "Articles", href: "/logged/pages/network/contents/articles" },
    { label: "Search results" },
  ];
  useEffect(() => {
    setPageMeta({ pageTitle: "Loading...", breadcrumbs });
  }, [setPageMeta, breadcrumbs]);
  return (
    <PageContentSection><p className="text-gray-500">Loading...</p></PageContentSection>
  );
}

const ArticleSearchResults: FC<PageProps> = ({ }) => {
  return (
    <Suspense fallback={<ArticleSearchFallback />}>
      <ArticleSearchResultsContent />
    </Suspense>
  );
};

export default ArticleSearchResults;
