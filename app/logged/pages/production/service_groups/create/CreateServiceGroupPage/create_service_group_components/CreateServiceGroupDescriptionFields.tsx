"use client";

import React, { FC } from "react";

export type CreateServiceGroupDescriptionFieldsProps = {
    service_base_description: string;
    onServiceBaseDescriptionChange: (value: string) => void;
    service_specifications: string;
    onServiceSpecificationsChange: (value: string) => void;
};

export const CreateServiceGroupDescriptionFields: FC<CreateServiceGroupDescriptionFieldsProps> = ({
    service_base_description,
    onServiceBaseDescriptionChange,
    service_specifications,
    onServiceSpecificationsChange,
}) => (
    <>
        <div>
            <label htmlFor="sg-description" className="block text-xs text-gray-600 mb-1">
                Description
            </label>
            <textarea
                id="sg-description"
                value={service_base_description}
                onChange={(e) => onServiceBaseDescriptionChange(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Base description inherited by services in this group."
            />
            <p className="text-xs text-gray-500 mt-1">This description is inherited by services in this group.</p>
        </div>
        <div>
            <label htmlFor="sg-specs" className="block text-xs text-gray-600 mb-1">
                Service specifications
            </label>
            <textarea
                id="sg-specs"
                value={service_specifications}
                onChange={(e) => onServiceSpecificationsChange(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Shared specifications for all services in this group."
            />
            <p className="text-xs text-gray-500 mt-1">These specifications are inherited by services in this group.</p>
        </div>
    </>
);
