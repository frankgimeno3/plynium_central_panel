"use client";

import React, { FC } from "react";
import Link from "next/link";

const AccountsPayablePage: FC = () => {
  return (
    <div className="flex flex-col w-full bg-white">
      <div className="flex items-center justify-center gap-3 flex-wrap bg-blue-950/70 p-5 text-white">
        <p className="text-2xl">Accounts payable</p>
      </div>
      <div className="flex flex-col w-full gap-4 p-12">
        <p className="text-gray-600 mb-4">
          Manage accounts payable. Provider invoices and payment schedules are used for forecasting in Banks.
        </p>
        <div className="flex gap-4">
          <Link
            href="/logged/pages/administration/provider-invoices"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Provider invoices
          </Link>
          <Link
            href="/logged/pages/administration/providers"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition-colors"
          >
            Providers
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountsPayablePage;
