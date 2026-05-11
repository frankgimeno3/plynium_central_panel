"use client";

import React, { FC } from "react";
import type { ProjectSelectFilter } from "./types";

type ProjectSelectModalFiltersProps = {
  filter: ProjectSelectFilter;
  onFilterChange: (next: ProjectSelectFilter) => void;
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

const ProjectSelectModalFilters: FC<ProjectSelectModalFiltersProps> = ({
  filter,
  onFilterChange,
}) => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
    <FilterField
      label="ID"
      value={filter.id}
      placeholder="Search by ID"
      onChange={(id) => onFilterChange({ ...filter, id })}
    />
    <FilterField
      label="Title"
      value={filter.title}
      placeholder="Search by title"
      onChange={(title) => onFilterChange({ ...filter, title })}
    />
    <FilterField
      label="Status"
      value={filter.status}
      placeholder="Search by status"
      onChange={(status) => onFilterChange({ ...filter, status })}
    />
    <FilterField
      label="Service"
      value={filter.service}
      placeholder="Search by service"
      onChange={(service) => onFilterChange({ ...filter, service })}
    />
    <FilterField
      label="Contract"
      value={filter.contract}
      placeholder="Search by contract"
      onChange={(contract) => onFilterChange({ ...filter, contract })}
    />
  </div>
);

export default ProjectSelectModalFilters;
