"use client";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export function CompanySelectNameFilter({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-bold text-gray-700">Filter by name</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type to filter companies…"
        className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-xl text-gray-800"
      />
    </div>
  );
}
