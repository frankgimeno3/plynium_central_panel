"use client";

import React, { FC } from "react";
import { CHANNEL_FILTER_OPTIONS } from "./constants";

export type ServiceGroupsFilterFormProps = {
    filterName: string;
    filterChannel: string;
    onFilterNameChange: (value: string) => void;
    onFilterChannelChange: (value: string) => void;
};

export const ServiceGroupsFilterForm: FC<ServiceGroupsFilterFormProps> = ({
    filterName,
    filterChannel,
    onFilterNameChange,
    onFilterChannelChange,
}) => (
    <>
        <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mb-4">
            <div>
                <label htmlFor="sg-filter-name" className="block text-xs text-gray-600 mb-1">
                    Name
                </label>
                <input
                    id="sg-filter-name"
                    type="text"
                    value={filterName}
                    onChange={(e) => onFilterNameChange(e.target.value)}
                    placeholder="Search by name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div>
                <label htmlFor="sg-filter-channel" className="block text-xs text-gray-600 mb-1">
                    Channel
                </label>
                <select
                    id="sg-filter-channel"
                    value={filterChannel}
                    onChange={(e) => onFilterChannelChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                    <option value="">All channels</option>
                    {CHANNEL_FILTER_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                            {c.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    </>
);
