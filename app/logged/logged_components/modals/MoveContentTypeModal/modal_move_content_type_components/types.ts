export interface MoveContentTypePreferentialRow {
  position_in_magazine: string;
  section_title: string;
  slot_content_type: string | null;
  slot_media_url?: string | null;
  slot_customer_id?: string | null;
  slot_project_id?: string | null;
  slot_article_id?: string | null;
}

export type MovableContentType = "summary" | "index";

export interface MoveContentTypeModalProps {
  open: boolean;
  onClose: () => void;
  contentType: MovableContentType;
  preferentialSlots: MoveContentTypePreferentialRow[];
  initialTarget?: string | null;
  onConfirm: (targetPosition: string, displacedPosition?: string | null) => Promise<void>;
}

export type ConflictMessage = {
  tone: "info" | "warning" | "error" | "success";
  text: string;
};

export type ReservedConflict = {
  otherType: MovableContentType;
  otherLabel: string;
};
