"use client";

type Props = {
  idFilter: string;
  name: string;
  portalName: string;
  portals: { id: number; name: string }[];
  dateFromDisplay: string;
  dateToDisplay: string;
  dateRangeValid: boolean;
  showDateError: boolean;
  onChangeIdFilter: (v: string) => void;
  onChangeName: (v: string) => void;
  onChangePortal: (v: string) => void;
  onChangeFromDisplay: (v: string) => void;
  onChangeToDisplay: (v: string) => void;
  onApply: () => void;
};

export function EventSelectFiltersPanel({
  idFilter,
  name,
  portalName,
  portals,
  dateFromDisplay,
  dateToDisplay,
  dateRangeValid,
  showDateError,
  onChangeIdFilter,
  onChangeName,
  onChangePortal,
  onChangeFromDisplay,
  onChangeToDisplay,
  onApply,
}: Props) {
  return (
    <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <p className="text-sm font-medium text-gray-700 mb-3">Filter</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">ID</label>
          <input
            type="text"
            value={idFilter}
            onChange={(e) => onChangeIdFilter(e.target.value)}
            placeholder="Event ID..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onChangeName(e.target.value)}
            placeholder="Event name..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Portal</label>
          <select
            value={portalName}
            onChange={(e) => onChangePortal(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950/20"
          >
            <option value="">All portals</option>
            {portals.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date from</label>
          <input
            type="text"
            value={dateFromDisplay}
            onChange={(e) => onChangeFromDisplay(e.target.value)}
            placeholder="dd/mm/yyyy"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date to</label>
          <input
            type="text"
            value={dateToDisplay}
            onChange={(e) => onChangeToDisplay(e.target.value)}
            placeholder="dd/mm/yyyy"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950/20"
          />
        </div>
      </div>
      {showDateError && (
        <p className="mt-2 text-xs text-red-600">Fill both From and To dates, or clear both.</p>
      )}
      <div className="flex justify-end mt-3">
        <button
          type="button"
          onClick={onApply}
          disabled={!dateRangeValid}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-950 text-white hover:bg-blue-950/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply filter
        </button>
      </div>
    </div>
  );
}
