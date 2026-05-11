"use client";

type Props = {
  nameFilter: string;
  idFilter: string;
  countryFilter: string;
  onFiltersChange: (next: {
    nameFilter?: string;
    idFilter?: string;
    countryFilter?: string;
  }) => void;
};

export function CompaniesDbSelectFilters({
  nameFilter,
  idFilter,
  countryFilter,
  onFiltersChange,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-bold text-gray-700">Name</label>
        <input
          type="text"
          value={nameFilter}
          onChange={(e) => {
            onFiltersChange({ nameFilter: e.target.value });
          }}
          placeholder="Filter by commercial name…"
          className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-800"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-bold text-gray-700">ID</label>
        <input
          type="text"
          value={idFilter}
          onChange={(e) => {
            onFiltersChange({ idFilter: e.target.value });
          }}
          placeholder="Filter by company ID…"
          className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-800 font-mono text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-bold text-gray-700">Country</label>
        <input
          type="text"
          value={countryFilter}
          onChange={(e) => {
            onFiltersChange({ countryFilter: e.target.value });
          }}
          placeholder="Filter by country…"
          className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-800"
        />
      </div>
    </div>
  );
}
