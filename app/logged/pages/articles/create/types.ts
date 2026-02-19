export interface Content {
  content_id: string;
  content_type: "text_image" | "image_text" | "just_image" | "just_text";
  content_content: {
    left: string;
    right: string;
    center: string;
  };
}

export interface ArticleData {
  id_article: string;
  articleTitle: string;
  articleSubtitle: string;
  article_main_image_url: string;
  company: string;
  date: string;
  article_tags_array: string[];
  contents_array: string[];
  highlited_position?: string;
  is_article_event?: boolean;
  event_id?: string;
}
