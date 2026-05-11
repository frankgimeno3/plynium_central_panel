"use client";

import React, { FC } from "react";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";

export const ServiceDetailNotFoundState: FC = () => (
  <PageContentSection>
    <div className="flex flex-col w-full">
      <div className="bg-white rounded-b-lg overflow-hidden">
        <div className="p-6 text-center text-gray-500">Service not found.</div>
      </div>
    </div>
  </PageContentSection>
);
