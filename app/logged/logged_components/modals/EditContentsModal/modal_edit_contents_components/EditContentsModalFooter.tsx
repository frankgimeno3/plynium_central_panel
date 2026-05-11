"use client";

interface Props {
  hasChanged: boolean;
  onCancel: () => void;
  onSaveClick: () => void;
}

export function EditContentsModalFooter({ hasChanged, onCancel, onSaveClick }: Props) {
  return (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
        onClick={onCancel}
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={onSaveClick}
        disabled={!hasChanged}
        className={`rounded-md px-4 py-2 text-sm font-medium text-white
              ${hasChanged ? "cursor-pointer bg-blue-600 hover:bg-blue-700" : "cursor-not-allowed bg-blue-300"}`}
      >
        Save changes
      </button>
    </div>
  );
}
