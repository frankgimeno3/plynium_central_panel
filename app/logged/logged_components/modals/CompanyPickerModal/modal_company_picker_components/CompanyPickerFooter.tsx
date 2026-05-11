"use client";

type Props = {
  page: number;
  totalPages: number;
  filteredCount: number;
  confirmLabel: string;
  disabledConfirm: boolean;
  onPrev: () => void;
  onNext: () => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CompanyPickerFooter({
  page,
  totalPages,
  filteredCount,
  confirmLabel,
  disabledConfirm,
  onPrev,
  onNext,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div className="p-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
      <div className="text-xs text-gray-500">
        Page {page} of {totalPages} · {filteredCount} shown
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
        >
          Next
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg">
          Cancel
        </button>
        <button
          type="button"
          disabled={disabledConfirm}
          onClick={onConfirm}
          className="px-4 py-1.5 text-sm rounded-lg bg-blue-950 text-white font-medium disabled:opacity-50"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
