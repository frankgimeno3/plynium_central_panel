"use client";

export type NotificationSubTabKey = "unread" | "read" | "solved";

type TabDef = { key: NotificationSubTabKey; label: string };

const tabs: TabDef[] = [
  { key: "unread", label: "Unread" },
  { key: "read", label: "Read" },
  { key: "solved", label: "Solved" },
];

type Props = {
  currentSubTab: NotificationSubTabKey;
  onSubTabChange: (key: NotificationSubTabKey) => void;
};

export default function NotificationSubTabBar({ currentSubTab, onSubTabChange }: Props) {
  return (
    <div className="flex border-b border-gray-200 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onSubTabChange(tab.key)}
          className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
            currentSubTab === tab.key
              ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
