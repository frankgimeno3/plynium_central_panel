"use client";

import React, { FC, useState } from "react";
import Link from "next/link";

type FilterType = "date" | "title" | "company";

const FILTER_LABELS: Record<FilterType, string> = {
  date: "By date",
  title: "By title",
  company: "By company",
};

/** Validates dd/mm/yy format and returns true if valid */
function isValidDdMmYy(value: string): boolean {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (!match) return false;
  const [, d, m, y] = match;
  const day = parseInt(d!, 10);
  const month = parseInt(m!, 10);
  const year = 2000 + parseInt(y!, 10);
  if (month < 1 || month > 12) return false;
  const lastDay = new Date(year, month, 0).getDate();
  return day >= 1 && day <= lastDay;
}

const ArticleFilter: FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("date");
  const [filterValue, setFilterValue] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const isDateRangeValid =
    dateFrom.trim() !== "" &&
    dateTo.trim() !== "" &&
    isValidDdMmYy(dateFrom) &&
    isValidDdMmYy(dateTo);

  const isFilterButtonEnabled =
    selectedFilter === "date"
      ? isDateRangeValid
      : filterValue.trim() !== "";

  const getFilterHref = (): string => {
    if (selectedFilter === "date") {
      if (!isFilterButtonEnabled) return "#";
      return `/logged/pages/network/contents/articles/search/${encodeURIComponent(`dateRange__${dateFrom.trim()}__${dateTo.trim()}`)}`;
    }
    if (!isFilterButtonEnabled) return "#";
    return `/logged/pages/network/contents/articles/search/${encodeURIComponent(`${selectedFilter}__${filterValue.trim()}`)}`;
  };

  return (
    <div className="mb-4">
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
        <p className="text-sm font-medium text-gray-700 mb-3">Filter</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {(["date", "title", "company"] as FilterType[]).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => {
                setSelectedFilter(filter);
                setFilterValue("");
                setDateFrom("");
                setDateTo("");
              }}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                selectedFilter === filter
                  ? "bg-blue-950 text-white border-blue-950"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {FILTER_LABELS[filter]}
            </button>
          ))}
        </div>

        <div className="flex flex-row items-center gap-4 flex-wrap">
          {selectedFilter === "date" && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="dd/mm/yy"
                maxLength={8}
                className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950/20 focus:border-blue-950/40 placeholder:text-gray-400"
              />
              <span className="text-gray-500 text-sm">to</span>
              <input
                type="text"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="dd/mm/yy"
                maxLength={8}
                className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950/20 focus:border-blue-950/40 placeholder:text-gray-400"
              />
            </div>
          )}
          {selectedFilter === "title" && (
            <input
              type="text"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950/20 focus:border-blue-950/40 placeholder:text-gray-400"
              placeholder="Type a title to filter"
            />
          )}
          {selectedFilter === "company" && (
            <input
              type="text"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950/20 focus:border-blue-950/40 placeholder:text-gray-400"
              placeholder="Type a company to filter"
            />
          )}
          {isFilterButtonEnabled ? (
            <Link
              href={getFilterHref()}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-blue-950 text-white hover:bg-blue-950/90 transition-colors inline-flex items-center"
            >
              Apply filter
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="px-3 py-2 text-xs rounded-lg bg-gray-200 text-gray-400 cursor-not-allowed"
            >
              Apply filter
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleFilter;
