export type MediatecaFolder = { id: string; name: string; path: string };
export type MediatecaContent = {
  id: string;
  name: string;
  folderPath: string;
  type: "pdf" | "image";
  content_type: "json" | "image";
  publishedAt: string;
  usedIn: string[];
  thumbnailUrl: string | null;
  url?: string | null;
  src: string;
};

export type ApiMediaItem = {
  id: string;
  name: string;
  s3Key: string;
  url?: string;
  folderPath: string;
  type?: "pdf" | "image";
  mimeType?: string;
};

export interface MediatecaModalProps {
  open: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string, content?: Pick<MediatecaContent, "id" | "name">) => void;
  initialPath?: string;
  allowPdfSelection?: boolean;
  ensureSlotMediatecaFolder?: { publicationId: string; slotId: number };
}
