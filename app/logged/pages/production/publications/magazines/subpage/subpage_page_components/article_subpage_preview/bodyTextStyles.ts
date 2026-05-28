export type ArticlePreviewBodyTextStyles = {
  chunkTextareaXPad: string;
  bodyTextSizeClass: string;
  gridTextShellClass: string;
  gridTextareaClass: string;
  gridTextPreviewClass: string;
  flowTextareaClass: string;
  flowTextShellClass: string;
  flowMediaShellClass: string;
  flowTextPreviewPadClass: string;
  headerTitleClass: string;
  headerSubtitleClass: string;
};

export function buildArticlePreviewBodyTextStyles(): ArticlePreviewBodyTextStyles {
  const chunkTextareaXPad = "px-8";
  const bodyTextSizeClass = "text-3xl leading-snug text-justify";
  const chunkBottomBorderClass = "border-b border-dashed border-gray-200";

  return {
    chunkTextareaXPad,
    bodyTextSizeClass,
    gridTextShellClass: `relative flex min-h-0 flex-1 flex-col bg-white [overflow-wrap:anywhere] ${chunkBottomBorderClass}`,
    gridTextareaClass: `block h-full min-h-0 w-full flex-1 border-0 bg-white ${chunkTextareaXPad} py-2 ${bodyTextSizeClass} text-gray-500 outline-none ring-0 transition placeholder:text-gray-400 focus:bg-white focus:outline-2 focus:outline-blue-300 [&_p]:text-justify`,
    gridTextPreviewClass: `min-h-0 flex-1 overflow-hidden bg-white ${chunkTextareaXPad} py-2 ${bodyTextSizeClass} text-gray-500 [&_.prose]:text-3xl [&_.prose]:leading-snug [&_.prose]:text-justify [&_.prose]:text-gray-500 [&_.prose_*]:text-gray-500 [&_.prose_p]:text-justify`,
    flowTextareaClass: `block w-full border-0 bg-white ${chunkTextareaXPad} py-2 ${bodyTextSizeClass} text-gray-800 outline-none ring-0 transition focus:bg-blue-50/40 focus:outline-2 focus:outline-blue-300 [&_p]:text-justify`,
    flowTextShellClass: `relative max-w-full break-inside-avoid bg-white [overflow-wrap:anywhere] ${chunkBottomBorderClass}`,
    flowMediaShellClass: `relative flex max-w-full break-inside-avoid flex-col [overflow-wrap:anywhere] ${chunkBottomBorderClass}`,
    flowTextPreviewPadClass: `${chunkTextareaXPad} py-2`,
    headerTitleClass:
      "text-[3.15rem] leading-tight tracking-tight text-white [&_*]:max-w-full [&_b]:font-bold [&_strong]:font-bold [&_em]:italic [&_i]:italic [&_p]:my-0 [&_p+p]:mt-1 [&_p]:text-[3.15rem]",
    headerSubtitleClass:
      "mt-1 text-2xl leading-snug text-white/95 [&_*]:max-w-full [&_b]:font-bold [&_strong]:font-bold [&_em]:italic [&_i]:italic [&_p]:my-0 [&_p+p]:mt-1",
  };
}

export const FLOW_BODY_COLUMN_CLASS =
  "h-full overflow-hidden text-3xl leading-snug text-justify text-gray-800 [overflow-wrap:anywhere] [&_.prose]:max-w-none [&_.prose]:break-words [&_.prose]:text-3xl [&_.prose]:leading-snug [&_.prose]:text-justify [&_.prose_*]:max-w-full [&_.prose_*]:break-words [&_.prose_*]:[overflow-wrap:anywhere] [&_.prose_p]:my-0 [&_.prose_p]:text-justify [&_.prose_p+p]:mt-1.5";

import { GRID_BODY_CONTAINER_PAD_CLASS } from "./gridBodyLayout";

export const GRID_BODY_CONTAINER_CLASS = `absolute inset-0 ${GRID_BODY_CONTAINER_PAD_CLASS}`;
