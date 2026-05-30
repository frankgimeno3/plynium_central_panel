import type { MagazinePageLayout } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/magazinePageLayout";
import type { MagazineArticleFlowPageInput } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/magazineArticleColumnFlow";
import type {
  GridCell,
  ImageAreaSelection,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_image_manager/articleImagePlacement";
import type { PublicationArticleChunk } from "../types";

export type ArticleSubpagePagePreviewProps = {
  chunks: PublicationArticleChunk[];
  pageIndex: number;
  isLeftPage: boolean;
  publicationPage: number | null;
  /** Used to hide the footer on cover / inside / end. */
  slotKey?: string | null;
  pageFormat: MagazinePageLayout;
  hideHeading?: boolean;
  articleFlowPages?: MagazineArticleFlowPageInput[];
  currentSlotContentId?: number | null;
  articleTitleHtml?: string | null;
  articleSubtitleHtml?: string | null;
  articleBox?: {
    company_name: string;
    company_direction?: string | null;
    company_city?: string | null;
    company_email?: string | null;
    company_phone?: string | null;
    company_web?: string | null;
  } | null;
  onRemoveArticleBox?: () => void;
  editable?: boolean;
  onChunkTextChange?: (chunkId: string, nextChunkHtml: string) => void;
  onChunkHtmlCommit?: (chunkId: string, nextChunkHtml: string) => void;
  onGridTextOverflowCheck?: (chunkId: string, editorEl: HTMLDivElement) => void;
  onChunkImageUpdate?: (chunkId: string) => void;
  onChunkCaptionUpdate?: (chunkId: string) => void;
  savingChunkIds?: ReadonlySet<string>;
  fillContainer?: boolean;
  chunkSelectionMode?: boolean;
  selectedChunkIds?: ReadonlySet<string>;
  onToggleChunkSelection?: (chunkId: string) => void;
  imageAreaSelectionMode?: boolean;
  imageAreas?: ImageAreaSelection[];
  onImageAreaCellClick?: (cell: GridCell) => void;
  onImageAreaRemove?: (areaId: string) => void;
  onOverlayImageDelete?: (chunkId: string) => void;
};
