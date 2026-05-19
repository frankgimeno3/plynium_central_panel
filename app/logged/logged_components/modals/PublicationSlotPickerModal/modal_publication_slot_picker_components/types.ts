export interface PublicationSlotPickerRow {
  publication_slot_id: number;
  publication_id: string | null;
  publication_format: string;
  slot_key: string;
  publication_page?: number | null;
  slot_ordinal?: number | null;
  slot_content_type: string;
  slot_state: string;
  customer_id: string | null;
  project_id: string | null;
  customer_name?: string | null;
}

export type PublicationSlotPickerSelectionMode = "single" | "multi";

export interface PublicationSlotPickerModalProps {
  open: boolean;
  onClose: () => void;
  publicationId: string;
  mode?: PublicationSlotPickerSelectionMode;
  title?: string;
  confirmLabel?: string;
  /** When set, only slots for which this returns true are listed (others are hidden, not disabled). */
  isSlotSelectable?: (slot: PublicationSlotPickerRow) => boolean;
  initialSelectedSlotIds?: number[];
  onConfirm: (slotIds: number[]) => void | Promise<void>;
}
