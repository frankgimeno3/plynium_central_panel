import { useMemo } from "react";
import type { CSSProperties } from "react";
import {
  areaCodeToCell,
  areaCodesToPlacement,
  groupGridBodyChunksByArea,
  normalizeAreaCodes,
  resolveAreaPlacement,
  type GridBodyAreaCell,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_image_manager/articleAreaCodes";
import {
  isOverlayImageChunk,
  parseOverlayPlacement,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_image_manager/articleImagePlacement";
import {
  isFlowBodyChunk,
  normalizeChunkFormat,
  previewBodyChunksForPage,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/magazineArticleColumnFlow";

function bodyChunkOverlapsOverlayCells(
  chunk: { chunk_area_array?: unknown },
  overlayBlockedCellKeys: ReadonlySet<string>
): boolean {
  if (overlayBlockedCellKeys.size === 0) return false;
  const codes = normalizeAreaCodes(chunk.chunk_area_array);
  for (const code of codes) {
    const cell = areaCodeToCell(code);
    if (cell && overlayBlockedCellKeys.has(`${cell.col}-${cell.row}`)) {
      return true;
    }
  }
  return false;
}
import { buildArticlePreviewBodyTextStyles } from "./bodyTextStyles";
import type { ArticleSubpagePagePreviewProps } from "./types";
import type { PublicationArticleChunk } from "../types";

export function useArticlePreviewPageModel(props: ArticleSubpagePagePreviewProps): {
  sorted: PublicationArticleChunk[];
  columnCount: number;
  textStyles: ReturnType<typeof buildArticlePreviewBodyTextStyles>;
  bodyColumnStyle: CSSProperties;
  overlayChunks: PublicationArticleChunk[];
  overlayBlockedCellKeys: Set<string>;
  useGridBodyLayout: boolean;
  headlineHtml: string;
  subtitleHtml: string;
  bodyFlowChunks: PublicationArticleChunk[];
  gridBodyCells: GridBodyAreaCell<PublicationArticleChunk>[] | null;
  footerNumber: string;
  showHeadline: boolean;
  showSubtitle: boolean;
  editable: boolean;
} {
  const {
    chunks,
    pageIndex,
    pageFormat,
    articleFlowPages,
    currentSlotContentId,
    articleTitleHtml: articleTitleHtmlProp,
    articleSubtitleHtml: articleSubtitleHtmlProp,
    editable = false,
    isLeftPage,
    publicationPage,
  } = props;

  const sorted = useMemo(
    () =>
      [...chunks].sort(
        (a, b) =>
          a.chunk_position - b.chunk_position ||
          a.publication_article_chunk_id.localeCompare(b.publication_article_chunk_id)
      ),
    [chunks]
  );

  const columnCount = pageFormat === "3_col_article" ? 3 : 2;
  const textStyles = useMemo(() => buildArticlePreviewBodyTextStyles(), []);

  const bodyColumnStyle = useMemo(
    (): CSSProperties => ({
      height: "100%",
      columnCount,
      columnFill: "auto",
      columnGap: 0,
      columnRuleWidth: "2px",
      columnRuleStyle: "solid",
      columnRuleColor: "rgb(229 231 235)",
      overflowWrap: "anywhere",
      wordBreak: "break-word",
    }),
    [columnCount]
  );

  const overlayChunks = useMemo(
    () =>
      sorted.filter((c) =>
        isOverlayImageChunk(
          c.chunk_html,
          c.publication_article_chunk_format,
          (c as { chunk_area_array?: unknown }).chunk_area_array
        )
      ),
    [sorted]
  );

  const overlayBlockedCellKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const chunk of overlayChunks) {
      const areaCodes = normalizeAreaCodes(
        (chunk as { chunk_area_array?: unknown }).chunk_area_array
      );
      const placement =
        areaCodes.length > 0
          ? areaCodesToPlacement(areaCodes, columnCount)
          : parseOverlayPlacement(chunk.chunk_html);
      if (!placement) continue;
      for (let c = placement.colStart; c <= placement.colEnd; c++) {
        for (let r = placement.rowStart; r <= placement.rowEnd; r++) {
          keys.add(`${c}-${r}`);
        }
      }
    }
    return keys;
  }, [overlayChunks, columnCount]);

  const useGridBodyLayout = useMemo(() => {
    if (editable && sorted.some((c) => isFlowBodyChunk(c))) return true;
    if (overlayChunks.length > 0) return true;
    return sorted.some((c) => {
      if (!isFlowBodyChunk(c)) return false;
      const codes = normalizeAreaCodes(
        (c as { chunk_area_array?: unknown }).chunk_area_array
      );
      if (!codes.length) return false;
      return (
        areaCodesToPlacement(codes, columnCount) != null ||
        resolveAreaPlacement(codes[0]!, columnCount) != null
      );
    });
  }, [sorted, overlayChunks, columnCount, editable]);

  const pageContent = useMemo(() => {
    const titleChunk = sorted.find(
      (c) => normalizeChunkFormat(c.publication_article_chunk_format) === "title"
    );
    const subtitleChunk = sorted.find(
      (c) => normalizeChunkFormat(c.publication_article_chunk_format) === "subtitle"
    );
    const titleHtml =
      (articleTitleHtmlProp != null && String(articleTitleHtmlProp).trim() !== ""
        ? String(articleTitleHtmlProp)
        : titleChunk?.chunk_html) ?? "";
    const subHtml =
      (articleSubtitleHtmlProp != null && String(articleSubtitleHtmlProp).trim() !== ""
        ? String(articleSubtitleHtmlProp)
        : subtitleChunk?.chunk_html) ?? "";

    const bodyChunksRaw = editable
      ? sorted.filter((c) => isFlowBodyChunk(c))
      : previewBodyChunksForPage(
          articleFlowPages,
          columnCount,
          currentSlotContentId,
          sorted
        );

    const bodyChunks = (
      overlayBlockedCellKeys.size > 0
        ? bodyChunksRaw.filter(
            (c) =>
              !bodyChunkOverlapsOverlayCells(
                c as PublicationArticleChunk,
                overlayBlockedCellKeys
              )
          )
        : bodyChunksRaw
    ) as PublicationArticleChunk[];

    const gridBodyCells: GridBodyAreaCell<PublicationArticleChunk>[] | null =
      useGridBodyLayout
        ? groupGridBodyChunksByArea(bodyChunks, columnCount).cells
        : null;

    return {
      headlineHtml: titleHtml,
      subtitleHtml: subHtml,
      bodyFlowChunks: bodyChunks as PublicationArticleChunk[],
      gridBodyCells: gridBodyCells as GridBodyAreaCell<PublicationArticleChunk>[] | null,
    };
  }, [
    sorted,
    columnCount,
    articleFlowPages,
    currentSlotContentId,
    editable,
    useGridBodyLayout,
    articleTitleHtmlProp,
    articleSubtitleHtmlProp,
    overlayBlockedCellKeys,
  ]);

  const footerNumber =
    publicationPage != null && Number.isFinite(publicationPage)
      ? String(Math.round(Number(publicationPage)))
      : pageIndex > 0
        ? String(pageIndex)
        : "—";

  const isFirstArticlePage = pageIndex === 1;
  const showHeadline = isFirstArticlePage || isLeftPage;
  const showSubtitle = isFirstArticlePage;

  return {
    sorted,
    columnCount,
    textStyles,
    bodyColumnStyle,
    overlayChunks,
    overlayBlockedCellKeys,
    useGridBodyLayout,
    ...pageContent,
    footerNumber,
    showHeadline,
    showSubtitle,
    editable,
  };
}
