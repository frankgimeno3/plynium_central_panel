export interface EventRow {
  id_fair: string;
  event_name: string;
  region?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
}

export interface EventSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectEvent: (eventId: string) => void;
  excludeEventId?: string;
}
