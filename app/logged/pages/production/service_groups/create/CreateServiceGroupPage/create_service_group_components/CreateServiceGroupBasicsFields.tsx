"use client";

import React, { FC } from "react";
import { CHANNEL_OPTIONS } from "./constants";
import type { ServiceGroupChannelOption } from "./types";

export type CreateServiceGroupBasicsFieldsProps = {
    service_group_name: string;
    onServiceGroupNameChange: (value: string) => void;
    service_group_channel: ServiceGroupChannelOption;
    onServiceGroupChannelChange: (value: ServiceGroupChannelOption) => void;
    tariff_price_eur: string;
    onTariffPriceEurChange: (value: string) => void;
};

export const CreateServiceGroupBasicsFields: FC<CreateServiceGroupBasicsFieldsProps> = ({
    service_group_name,
    onServiceGroupNameChange,
    service_group_channel,
    onServiceGroupChannelChange,
    tariff_price_eur,
    onTariffPriceEurChange,
}) => (
    <>
        <div>
            <label htmlFor="sg-name" className="block text-xs text-gray-600 mb-1">
                Name
            </label>
            <input
                id="sg-name"
                type="text"
                value={service_group_name}
                onChange={(e) => onServiceGroupNameChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Newsletter Banner"
                autoComplete="off"
            />
        </div>
        <div>
            <label htmlFor="sg-channel" className="block text-xs text-gray-600 mb-1">
                Channel
            </label>
            <select
                id="sg-channel"
                value={service_group_channel}
                onChange={(e) => onServiceGroupChannelChange(e.target.value as ServiceGroupChannelOption)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
                <option value="">Select channel…</option>
                {CHANNEL_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                        {c.label}
                    </option>
                ))}
            </select>
        </div>
        <div>
            <label htmlFor="sg-tariff" className="block text-xs text-gray-600 mb-1">
                Standard tariff price (€)
            </label>
            <input
                id="sg-tariff"
                type="number"
                min={0}
                step={0.01}
                value={tariff_price_eur}
                onChange={(e) => onTariffPriceEurChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    </>
);
