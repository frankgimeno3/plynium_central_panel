"use client";

import React, { FC } from "react";

export type CreateServiceGroupFormActionsProps = {
    error: string | null;
    submitting: boolean;
    canSubmit: boolean;
    onCancel: () => void;
};

export const CreateServiceGroupFormActions: FC<CreateServiceGroupFormActionsProps> = ({
    error,
    submitting,
    canSubmit,
    onCancel,
}) => (
    <>
        {error && (
            <p className="text-sm text-red-600" role="alert">
                {error}
            </p>
        )}
        <div className="flex gap-3 pt-2">
            <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-300"
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={!canSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {submitting ? "Creating…" : "Create"}
            </button>
        </div>
    </>
);
