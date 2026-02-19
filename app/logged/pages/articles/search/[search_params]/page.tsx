"use client";

import { FC, useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import ArticleMiniature from '@/app/logged/pages/articles/article_components/ArticleMiniature';
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
          headingText = `Articles with coincidences with "${filterValue}"`;
        } else if (filterType === 'company') {
          headingText = `Articles related to company ${filterValue}`;
        }
        setHeading(headingText);

        // Get all articles from API
        const apiArticles = await ArticleService.getAllArticles();
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

  if (loading) {
    return (
      <div className='flex flex-col w-full bg-white'>
        <div className='flex flex-col text-center bg-blue-950/70 p-5 px-46 text-white'>
          <h2 className='text-xl font-semibold'>Cargando...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col w-full bg-white'>
      <div className='flex flex-col text-center bg-blue-950/70 p-5 px-46 text-white'>
        <h2 className='text-xl font-semibold'>{heading}</h2>
        {type && value && (
          <p className='text-xs text-gray-200 mt-1'>
            Search type: <span className='font-mono'>{type}</span> · Query:{' '}
            <span className='font-mono'>
              {type === 'date' ? formatDateForDisplay(value) : value}
            </span>
          </p>
        )}
      </div>

      <ArticleFilter />

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
              />
            ))
          ) : (
            <div className='flex flex-col items-center justify-center py-12 w-full'>
              <p className='text-gray-500 text-lg'>No results found for your query</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ArticleSearchResults: FC<PageProps> = ({ }) => {
  return (
    <Suspense fallback={
      <div className='flex flex-col w-full bg-white'>
        <div className='flex flex-col text-center bg-blue-950/70 p-5 px-46 text-white'>
          <h2 className='text-xl font-semibold'>Cargando...</h2>
        </div>
      </div>
    }>
      <ArticleSearchResultsContent />
    </Suspense>
  );
};

export default ArticleSearchResults;
