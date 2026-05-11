"use client";

import React, { FC } from "react";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";

export const ServiceGroupDetailLoadingPanel: FC = () => (
    <PageContentSection>
        <div className="flex flex-col w-full">
            <div className="bg-white rounded-b-lg overflow-hidden p-6 text-sm text-gray-500">Loading…</div>
        </div>
    </PageContentSection>
);
