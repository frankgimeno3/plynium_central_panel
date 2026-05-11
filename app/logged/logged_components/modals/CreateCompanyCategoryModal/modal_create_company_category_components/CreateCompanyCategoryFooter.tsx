"use client";

type Props = {
  submitting: boolean;
  disabledConfirm: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CreateCompanyCategoryFooter({
  submitting,
  disabledConfirm,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div className="flex justify-end gap-2 p-4 border-t">
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={disabledConfirm}
        className="px-4 py-2 text-sm rounded-lg bg-blue-950 text-white hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Creating…" : "Create"}
      </button>
    </div>
  );
}
