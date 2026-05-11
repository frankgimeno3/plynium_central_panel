"use client";

import React, { FC } from "react";

export const CreateServiceGroupIntro: FC = () => (
    <>
        <p className="text-sm font-semibold text-gray-700 mb-1">New service group</p>
        <p className="text-xs text-gray-500 mb-6">
            Name is stored as lowercase snake_case (letters, numbers, underscores). UUID is assigned automatically.
        </p>
    </>
);
