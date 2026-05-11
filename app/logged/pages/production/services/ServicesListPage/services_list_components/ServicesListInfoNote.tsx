"use client";

import React, { FC } from "react";

export const ServicesListInfoNote: FC = () => (
  <div
    className="mt-6 mb-4 rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-gray-800"
    role="note"
  >
    <p className="font-medium text-gray-900 mb-1">How services relate to service groups</p>
    <p className="mb-2">
      Each service <strong>inherits</strong> the shared <strong>description</strong> and{" "}
      <strong>specifications</strong> defined on its <strong>service group</strong>.
    </p>
    <p className="mb-2">
      Listed services are separate <strong>instances</strong> of that template; they can still hold{" "}
      <strong>case-specific</strong> adjustments where the product requires it.
    </p>
    <p className="mb-0">
      On <strong>proposals</strong>, agents may <strong>always</strong> apply <strong>final</strong> wording or detail
      changes before the offer is sent.
    </p>
  </div>
);
