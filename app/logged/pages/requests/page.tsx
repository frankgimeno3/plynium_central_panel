"use client";

import React, { FC } from 'react';
import Link from 'next/link';

interface AdvertisementProps {}

const Advertisement: FC<AdvertisementProps> = () => {
  return (
    <div className="flex flex-col w-full bg-white">
      <div className="text-center bg-blue-950/70 p-5 text-white">
        <p className="text-2xl">Requests</p>
        <p className="text-sm text-blue-100 mt-1">Select a request type to manage</p>
      </div>
      <div className="px-6 py-12 flex flex-col gap-4 max-w-2xl mx-auto">
        <Link
          href="/logged/pages/requests/quotations"
          className="flex flex-col p-6 rounded-lg border border-gray-200 bg-white hover:bg-blue-50/50 hover:border-blue-950/30 transition-colors"
        >
          <span className="font-semibold text-gray-900">Advertisement quotations</span>
          <span className="text-sm text-gray-500 mt-1">Manage advertisement requests and quotations</span>
        </Link>
        <Link
          href="/logged/pages/requests/company"
          className="flex flex-col p-6 rounded-lg border border-gray-200 bg-white hover:bg-blue-50/50 hover:border-blue-950/30 transition-colors"
        >
          <span className="font-semibold text-gray-900">Company</span>
          <span className="text-sm text-gray-500 mt-1">Requests to create a company profile in the directory</span>
        </Link>
        <Link
          href="/logged/pages/requests/requests"
          className="flex flex-col p-6 rounded-lg border border-gray-200 bg-white hover:bg-blue-50/50 hover:border-blue-950/30 transition-colors"
        >
          <span className="font-semibold text-gray-900">Other requests</span>
          <span className="text-sm text-gray-500 mt-1">General contact and other inquiries</span>
        </Link>
      </div>
    </div>
  );
};

export default Advertisement;
