export interface PublicationSlotPickerRow {
  publication_slot_id: number;
  publication_id: string | null;
  publication_format: string;
  slot_key: string;
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
  isSlotSelectable?: (slot: PublicationSlotPickerRow) => boolean;
  initialSelectedSlotIds?: number[];
  onConfirm: (slotIds: number[]) => void | Promise<void>;
}
