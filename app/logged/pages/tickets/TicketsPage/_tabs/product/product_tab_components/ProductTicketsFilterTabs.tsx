"use client";

type TicketState = "pending" | "in_process" | "solved" | "other";

type Props = {
  tabs: { key: TicketState; label: string }[];
  currentTab: TicketState;
  onTabChange: (key: TicketState) => void;
  counts: Record<TicketState, number>;
};

export default function ProductTicketsFilterTabs({ tabs, currentTab, onTabChange, counts }: Props) {
  return (
    <div className="flex border-b border-gray-200 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onTabChange(tab.key)}
          className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
            currentTab === tab.key
              ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          {tab.label}
          {tab.key === "pending" && counts.pending > 0 && (
            <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600">
              {counts.pending}
            </span>
          )}
          {tab.key !== "pending" && tab.key !== "solved" && counts[tab.key] > 0 && (
            <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold leading-none bg-gray-200 text-gray-700">
              {counts[tab.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
