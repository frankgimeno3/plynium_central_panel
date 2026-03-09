export interface articleInterface {
  id_article: string;
  articleTitle: string;
  articleSubtitle: string;
  article_main_image_url: string;
  article_tags_array: string[];
  contents_array: string[];
  company: string;
  date: string;
  highlited_position?: string;
  is_article_event?: boolean;
  event_id?: string;
}
/** Miniature/card view of an article (content title, subtitle, image) */
export interface articleMiniatureInterface {
    /** Content title */
    contenidoTitulo: string;
    /** Content subtitle */
    contenidoSubtitulo: string;
    /** Image URL */
    url_imagen: string;
}

/** Publication (e.g. magazine issue). revista = magazine name, número = issue number */
export interface publicationInterface {
  id_publication: string;
  redirectionLink: string;
  date: string;
  /** Magazine name */
  revista: string;
  /** Issue number */
  número: number | string;
  publication_main_image_url: string;
}

export interface Company {
  companyId: string;
  commercialName: string;
  country: string;
  category: string;
  mainDescription: string;
  mainImage: string;
  productsArray: string[];
  categoriesArray: string[];
  mainEmail: string;
  mailTelephone: string;
  fullAddress: string;
  webLink: string;
}

export interface CompanyBasic {
  companyId: string;
  commercialName: string;
}

export interface Product {
  productId: string;
  productName: string;
  price: number;
  company: string;
  productDescription: string;
  mainImageSrc: string;
  productCategoriesArray: string[];
}