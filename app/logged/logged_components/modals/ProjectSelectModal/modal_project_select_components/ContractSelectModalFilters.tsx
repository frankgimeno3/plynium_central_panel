"use client";

import React, { FC } from "react";
import type { ContractSelectFilter } from "./types";

type ContractSelectModalFiltersProps = {
  filter: ContractSelectFilter;
  onFilterChange: (next: ContractSelectFilter) => void;
};

type FilterFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

const FilterField: FC<FilterFieldProps> = ({ label, value, placeholder, onChange }) => (
  <div>
    <label className="block text-xs text-gray-600 mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
      placeholder={placeholder}
    />
  </div>
);

const ContractSelectModalFilters: FC<ContractSelectModalFiltersProps> = ({
  filter,
  onFilterChange,
}) => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
    <FilterField
      label="Contract ID"
      value={filter.id}
      placeholder="Search by contract ID"
      onChange={(id) => onFilterChange({ ...filter, id })}
    />
    <FilterField
      label="Title"
      value={filter.title}
      placeholder="Search by title"
      onChange={(title) => onFilterChange({ ...filter, title })}
    />
    <FilterField
      label="Customer ID"
      value={filter.customer}
      placeholder="Search by customer"
      onChange={(customer) => onFilterChange({ ...filter, customer })}
    />
    <FilterField
      label="Process state"
      value={filter.processState}
      placeholder="Search by process state"
      onChange={(processState) => onFilterChange({ ...filter, processState })}
    />
    <FilterField
      label="Payment state"
      value={filter.paymentState}
      placeholder="Search by payment state"
      onChange={(paymentState) => onFilterChange({ ...filter, paymentState })}
    />
  </div>
);

export default ContractSelectModalFilters;
