"use client";

import React, { FC } from "react";

type PublicationSlotPickerFilterProps = {
  value: string;
  onChange: (value: string) => void;
};

const PublicationSlotPickerFilter: FC<PublicationSlotPickerFilterProps> = ({
  value,
  onChange,
}) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder="Filter by id, slot key, content type, customer, project…"
    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  />
);

export default PublicationSlotPickerFilter;
