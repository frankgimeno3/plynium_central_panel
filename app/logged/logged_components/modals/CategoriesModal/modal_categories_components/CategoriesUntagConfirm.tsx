"use client";

type Props = {
  categoryName: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CategoriesUntagConfirm({ categoryName, onCancel, onConfirm }: Props) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="untag-confirm-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="untag-confirm-title" className="text-lg font-semibold text-gray-900 mb-2">
          Untag category
        </h3>
        <p className="text-gray-600 mb-4">Are you sure you want to untag this company as {categoryName}?</p>
        <div className="flex justify-end gap-2">
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
            className="px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700"
          >
            Yes, untag
          </button>
        </div>
      </div>
    </div>
  );
}
