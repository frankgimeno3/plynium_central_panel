"use client";

type Props = {
  filter: string;
  onChange: (v: string) => void;
};

export function CompanyPickerSearchBar({ filter, onChange }: Props) {
  return (
    <div className="p-4 border-b border-gray-100 space-y-2">
      <input
        type="search"
        value={filter}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Filter by name, ID, or country…"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
    </div>
  );
}
