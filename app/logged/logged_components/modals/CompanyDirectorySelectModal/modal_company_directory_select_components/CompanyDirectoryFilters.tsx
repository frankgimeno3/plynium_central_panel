"use client";

type Props = {
  nameFilter: string;
  onNameFilterChange: (value: string) => void;
};

export function CompanyDirectoryFilters({ nameFilter, onNameFilterChange }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-bold text-gray-700">Filter</label>
      <input
        type="text"
        value={nameFilter}
        onChange={(e) => {
          onNameFilterChange(e.target.value);
        }}
        placeholder="Filter by name, ID, country, category…"
        className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-xl text-gray-800"
      />
    </div>
  );
}
