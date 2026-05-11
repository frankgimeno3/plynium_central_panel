"use client";

type Props = {
  confirmLabel: string;
  canConfirm: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function MagazineSelectFooter({
  confirmLabel,
  canConfirm,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={!canConfirm}
        className="px-4 py-2 rounded-xl bg-blue-950 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-900"
      >
        {confirmLabel}
      </button>
    </div>
  );
}
