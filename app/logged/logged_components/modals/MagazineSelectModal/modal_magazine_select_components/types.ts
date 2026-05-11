import type { Magazine } from "@/app/contents/interfaces";

export type MagazineFilterState = { id: string; name: string };

export interface MagazineSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectMagazine: (magazine: Magazine) => void;
  confirmLabel?: string;
}

export type { Magazine };