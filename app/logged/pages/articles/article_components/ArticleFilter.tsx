"use client";

import React, { FC, useState, useEffect } from "react";
import Link from "next/link";
import { PortalService } from "@/app/service/PortalService";

interface ArticleFilterProps {
  selectedPortalNames?: string[];
}

type FilterType = "date" | "title" | "company" | "portal";

const ArticleFilter: FC<ArticleFilterProps> = ({ selectedPortalNames = [] }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("date");
  const [filterValue, setFilterValue] = useState("");
  const [portals, setPortals] = useState<{ id: number; name: string }[]>([]);
  const [portalChecklist, setPortalChecklist] = useState<string[]>([]);

  useEffect(() => {
    PortalService.getAllPortals().then((list: any[]) => {
      setPortals(Array.isArray(list) ? list.map((p) => ({ id: p.id, name: p.name ?? String(p.key ?? p.id) })) : []);
    }).catch(() => setPortals([]));
  }, []);

  useEffect(() => {
    setPortalChecklist(selectedPortalNames);
  }, [selectedPortalNames.join(",")]);

  const toggleFilter = () => {
    setIsFilterOpen((prev) => !prev);
  };

  const handleSelectFilter = (filter: FilterType) => {
    setSelectedFilter(filter);
    setFilterValue("");
    if (filter === "portal") setPortalChecklist(selectedPortalNames);
  };

  const togglePortal = (name: string) => {
    setPortalChecklist((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const isFilterButtonEnabled =
    selectedFilter === "portal"
      ? portalChecklist.length > 0
      : filterValue.trim() !== "";

  const getFilterHref = () => {
    if (selectedFilter === "portal") {
      if (portalChecklist.length === 0) return "#";
      return `/logged/pages/articles?portalNames=${encodeURIComponent(portalChecklist.join(","))}`;
    }
    if (!isFilterButtonEnabled) return "#";
    const searchParam = `${selectedFilter}__${filterValue.trim()}`;
    return `/logged/pages/articles/search/${encodeURIComponent(searchParam)}`;
  };

  return (
    <div className="px-36 mx-7">
      <div
        className="flex flex-col border border-gray-100 shadow-xl text-center py-2 text-xs cursor-pointer hover:bg-gray-100/80"
        onClick={toggleFilter}
      >
        <p>{isFilterOpen ? "Click to close filter" : "Click to open filter"}</p>
      </div>
      {isFilterOpen && (
        <div className="min-h-56 bg-white mb-12 shadow-xl border border-gray-100">
          <div className="flex flex-row p-5 w-full justify-between px-24 flex-wrap gap-2">
            <button
              onClick={() => handleSelectFilter("date")}
              className={`px-4 py-2 text-xs rounded-lg shadow-sm ${
                selectedFilter === "date"
                  ? "bg-blue-950 text-white"
                  : "bg-gray-100 hover:bg-gray-100/50 text-gray-700 cursor-pointer"
              }`}
            >
              Filter by date
            </button>
            <button
              onClick={() => handleSelectFilter("title")}
              className={`px-4 py-2 text-xs rounded-lg shadow-sm ${
                selectedFilter === "title"
                  ? "bg-blue-950 text-white"
                  : "bg-gray-100 hover:bg-gray-100/50 text-gray-700 cursor-pointer"
              }`}
            >
              Filter by title
            </button>
            <button
              onClick={() => handleSelectFilter("company")}
              className={`px-4 py-2 text-xs rounded-lg shadow-sm ${
                selectedFilter === "company"
                  ? "bg-blue-950 text-white"
                  : "bg-gray-100 hover:bg-gray-100/50 text-gray-700 cursor-pointer"
              }`}
            >
              Filter by company
            </button>
            <button
              onClick={() => handleSelectFilter("portal")}
              className={`px-4 py-2 text-xs rounded-lg shadow-sm ${
                selectedFilter === "portal"
                  ? "bg-blue-950 text-white"
                  : "bg-gray-100 hover:bg-gray-100/50 text-gray-700 cursor-pointer"
              }`}
            >
              Filter by portal
            </button>
          </div>

          <div className="px-24 pb-5">
            <div className="flex flex-row items-center gap-4 bg-white border border-gray-100 shadow-xl rounded-lg px-4 py-3 flex-wrap">
              {selectedFilter === "date" && (
                <input
                  type="date"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="bg-white border-none outline-none text-sm w-full placeholder:text-gray-200"
                  placeholder="Select a date to filter"
                />
              )}
              {selectedFilter === "title" && (
                <input
                  type="text"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="bg-white border-none outline-none text-sm w-full placeholder:text-gray-200"
                  placeholder="Type a title to filter"
                />
              )}
              {selectedFilter === "company" && (
                <input
                  type="text"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="bg-white border-none outline-none text-sm w-full placeholder:text-gray-200"
                  placeholder="Type a company to filter"
                />
              )}
              {selectedFilter === "portal" && (
                <div className="flex flex-col gap-2 w-full">
                  <p className="text-xs text-gray-600">Select one or more portals (by name):</p>
                  <div className="flex flex-wrap gap-3">
                    {portals.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={portalChecklist.includes(p.name)}
                          onChange={() => togglePortal(p.name)}
                          className="rounded border-gray-300"
                        />
                        <span>{p.name}</span>
                      </label>
                    ))}
                    {portals.length === 0 && (
                      <span className="text-gray-400 text-xs">Loading portals...</span>
                    )}
                  </div>
                </div>
              )}
              {isFilterButtonEnabled ? (
                <Link
                  href={getFilterHref()}
                  className="px-3 py-1 text-xs cursor-pointer rounded-lg shadow-xl bg-blue-950 text-white inline-block"
                >
                  Filter
                </Link>
              ) : (
                <button
                  disabled
                  className="px-3 py-1 text-xs rounded-lg bg-gray-200 text-gray-400 cursor-not-allowed"
                >
                  Filter
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleFilter;
