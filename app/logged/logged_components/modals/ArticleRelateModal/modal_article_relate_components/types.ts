export type PortalRow = {
  id: number;
  key: string;
  name: string;
};

export type CompanyRow = {
  companyId: string;
  commercialName: string;
  country?: string;
  region?: string;
};

export type ArticleRelateRow = {
  id_article: string;
  articleTitle: string;
  article_main_image_url?: string;
  company: string;
  article_company_names_array: string[];
  article_company_id_array: string[];
  date: string | null;
};

export type DateParts = {
  day: string;
  month: string;
  year: string;
};

export type ArticleFilterState = {
  id: string;
  title: string;
  from: DateParts;
  to: DateParts;
};
