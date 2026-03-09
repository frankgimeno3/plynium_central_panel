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

/** Payment/order linked to an issued invoice. Format: CXX.000000Y-00Z (Z = serial) */
export interface Order {
  order_code: string;
  collection_date: string;
  status: 'paid' | 'pending';
  amount_eur: number;
}

/** Issued invoice belonging to a contract. A contract has at least one invoice. */
export interface IssuedInvoice {
  invoice_id: string;
  amount_eur: number;
  issue_date: string;
  orders: Order[];
}

/** Contract code format: CXX.000000Y (XX = year, Y = serial) */
export interface AdministrationContract {
  contract_code: string;
  client_id: string;
  client_name: string;
  invoices: IssuedInvoice[];
}

/** Flat row for the administration super table: one row per order */
export interface OrderRow {
  order_code: string;
  contract_code: string;
  invoice_id: string;
  collection_date: string;
  payment_status: 'paid' | 'pending';
  client_id: string;
  client_name: string;
  amount_eur: number;
}

export interface Provider {
  id_provider: string;
  name: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface ProviderInvoice {
  id: string;
  id_provider: string;
  provider_name: string;
  amount_eur: number;
  payment_date: string;
}