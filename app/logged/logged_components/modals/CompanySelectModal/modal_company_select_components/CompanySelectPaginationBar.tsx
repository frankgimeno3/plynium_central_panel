"use client";

type Props = {
  currentPage: number;
  totalPages: number;
  totalFiltered: number;
  onPrev: () => void;
  onNext: () => void;
  onConfirm: () => void;
  disabledConfirm: boolean;
};

export function CompanySelectPaginationBar({
  currentPage,
  totalPages,
  totalFiltered,
  onPrev,
  onNext,
  onConfirm,
  disabledConfirm,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-4 pt-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentPage === 0}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage + 1} of {totalPages} ({totalFiltered} companies)
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={currentPage >= totalPages - 1}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>
      <button
        type="button"
        onClick={onConfirm}
        disabled={disabledConfirm}
        className="px-4 py-2 rounded-xl bg-blue-950 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-900"
      >
        Confirm
      </button>
    </div>
  );
}
