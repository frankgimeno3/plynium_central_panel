"use client";

import React, { FC } from "react";
import type { ServiceGroupDetailModel } from "./types";
import type { ServiceGroupDetailChannel } from "./constants";
import { CHANNEL_OPTIONS } from "./constants";

export type ServiceGroupDetailEditFormProps = {
    group: ServiceGroupDetailModel;
    editName: string;
    onEditNameChange: (value: string) => void;
    editChannel: ServiceGroupDetailChannel | "";
    onEditChannelChange: (value: ServiceGroupDetailChannel | "") => void;
    editTariff: string;
    onEditTariffChange: (value: string) => void;
    editBaseDescription: string;
    onEditBaseDescriptionChange: (value: string) => void;
    editSpecifications: string;
    onEditSpecificationsChange: (value: string) => void;
    saveError: string | null;
    canSave: boolean;
    saving: boolean;
    onSubmit: (e: React.FormEvent) => void;
};

export const ServiceGroupDetailEditForm: FC<ServiceGroupDetailEditFormProps> = ({
    group,
    editName,
    onEditNameChange,
    editChannel,
    onEditChannelChange,
    editTariff,
    onEditTariffChange,
    editBaseDescription,
    onEditBaseDescriptionChange,
    editSpecifications,
    onEditSpecificationsChange,
    saveError,
    canSave,
    saving,
    onSubmit,
}) => (
    <div className="bg-white rounded-b-lg overflow-hidden border border-gray-200">
        <div className="p-6">
            <p className="text-sm font-semibold text-gray-700 mb-1">Service group</p>
            <p className="text-xs text-gray-500 mb-4">Edit the name exactly as you want it to be stored.</p>
            <form onSubmit={onSubmit} className="space-y-4 max-w-3xl">
                <div>
                    <span className="block text-gray-500 text-xs uppercase tracking-wide mb-1">ID</span>
                    <p className="font-mono text-sm text-gray-900 break-all">{group.service_group_id}</p>
                </div>
                <div>
                    <label htmlFor="sg-detail-name" className="block text-xs text-gray-600 mb-1">
                        Name
                    </label>
                    <input
                        id="sg-detail-name"
                        type="text"
                        value={editName}
                        onChange={(e) => onEditNameChange(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Newsletter Banner"
                        autoComplete="off"
                    />
                </div>
                <div>
                    <label htmlFor="sg-detail-channel" className="block text-xs text-gray-600 mb-1">
                        Channel
                    </label>
                    <select
                        id="sg-detail-channel"
                        value={editChannel}
                        onChange={(e) => onEditChannelChange(e.target.value as ServiceGroupDetailChannel | "")}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="">Select channel…</option>
                        {CHANNEL_OPTIONS.map((c) => (
                            <option key={c.value} value={c.value}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                    {group.service_group_channel &&
                        !CHANNEL_OPTIONS.some((o) => o.value === String(group.service_group_channel).toLowerCase()) && (
                            <p className="text-xs text-amber-700 mt-1">
                                Current DB value &quot;{group.service_group_channel}&quot; is not in the standard list;
                                choose dem, portal, or magazine to save.
                            </p>
                        )}
                </div>
                <div>
                    <label htmlFor="sg-detail-tariff" className="block text-xs text-gray-600 mb-1">
                        Standard tariff price (€)
                    </label>
                    <input
                        id="sg-detail-tariff"
                        type="number"
                        min={0}
                        step={0.01}
                        value={editTariff}
                        onChange={(e) => onEditTariffChange(e.target.value)}
                        className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="sg-detail-desc" className="block text-xs text-gray-600 mb-1">
                        Description
                    </label>
                    <textarea
                        id="sg-detail-desc"
                        value={editBaseDescription}
                        onChange={(e) => onEditBaseDescriptionChange(e.target.value)}
                        rows={8}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Base description inherited by services in this group."
                    />
                    <p className="text-xs text-gray-500 mt-1">This description is inherited by services in this group.</p>
                </div>
                <div>
                    <label htmlFor="sg-detail-specs" className="block text-xs text-gray-600 mb-1">
                        Service specifications
                    </label>
                    <textarea
                        id="sg-detail-specs"
                        value={editSpecifications}
                        onChange={(e) => onEditSpecificationsChange(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Shared specifications for all services in this group."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        These specifications are inherited by services in this group.
                    </p>
                </div>
                {saveError && (
                    <p className="text-sm text-red-600" role="alert">
                        {saveError}
                    </p>
                )}
                <button
                    type="submit"
                    disabled={!canSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
                >
                    {saving ? "Saving…" : "Save changes"}
                </button>
            </form>
        </div>
    </div>
);
// 