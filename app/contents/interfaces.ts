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
export interface articleMiniatureInterface {
    contenidoTitulo: string,
    contenidoSubtitulo: string,
    url_imagen: string
}

export interface publicationInterface {
  id_publication: string;
  redirectionLink: string;
  date: string;
  revista: string;
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