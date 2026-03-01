"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DateInputs, parseDateFields, buildDateStr } from "@/app/logged/logged_components/DateInputs";

const HIGHLITED_POSITION_OPTIONS = [
  { value: "", label: "(None)" },
  { value: "Main article", label: "Main article" },
  { value: "Position1", label: "Position1" },
  { value: "Position2", label: "Position2" },
  { value: "Position3", label: "Position3" },
  { value: "Position4", label: "Position4" },
  { value: "Position5", label: "Position5" },
];

interface ArticlePhase1Props {
  idArticle: string;
  isGeneratingId: boolean;
  articleTitle: string;
  setArticleTitle: (v: string) => void;
  articleSubtitle: string;
  setArticleSubtitle: (v: string) => void;
  articleMainImageUrl: string;
  setArticleMainImageUrl: (v: string) => void;
  company: string;
  setCompany: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  highlitedPosition: string;
  setHighlitedPosition: (v: string) => void;
  isArticleEvent: boolean;
  setIsArticleEvent: (v: boolean) => void;
  eventId: string;
  setEventId: (v: string) => void;
  tags: string;
  setTags: (v: string) => void;
  tagsArray: string[];
  portals: { id: number; name: string }[];
  selectedPortalIds: number[];
  onTogglePortal: (portalId: number) => void;
  onAddTag: () => void;
  onRemoveTag: (index: number) => void;
  onNext: () => void;
}

const ArticlePhase1: React.FC<ArticlePhase1Props> = ({
  idArticle,
  isGeneratingId,
  articleTitle,
  setArticleTitle,
  articleSubtitle,
  setArticleSubtitle,
  articleMainImageUrl,
  setArticleMainImageUrl,
  company,
  setCompany,
  date,
  setDate,
  highlitedPosition,
  setHighlitedPosition,
  isArticleEvent,
  setIsArticleEvent,
  eventId,
  setEventId,
  tags,
  setTags,
  tagsArray,
  portals,
  selectedPortalIds,
  onTogglePortal,
  onAddTag,
  onRemoveTag,
  onNext,
}) => {
  const router = useRouter();
  const [dateDay, setDateDay] = useState("");
  const [dateMonth, setDateMonth] = useState("");
  const [dateYear, setDateYear] = useState("");

  useEffect(() => {
    const p = parseDateFields(date);
    setDateDay(p.day);
    setDateMonth(p.month);
    setDateYear(p.year);
  }, [date]);

  const handleDateChange = (day: string, month: string, year: string) => {
    setDateDay(day);
    setDateMonth(month);
    setDateYear(year);
    setDate(buildDateStr(day, month, year));
  };

  const canGoNext = !isGeneratingId && !!articleTitle && !!date && selectedPortalIds.length >= 1;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Article Data</h2>

      <div className="space-y-2">
        <label className="font-bold text-lg">Article ID *</label>
        <input
          type="text"
          value={isGeneratingId ? "Generating..." : idArticle}
          readOnly
          disabled={isGeneratingId}
          className="w-full px-4 py-2 border rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
          placeholder="article_25_000000001"
        />
        {isGeneratingId && (
          <p className="text-sm text-gray-500">Generating ID automatically...</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="font-bold text-lg">Article Title *</label>
        <input
          type="text"
          value={articleTitle}
          onChange={(e) => setArticleTitle(e.target.value)}
          className="w-full px-4 py-2 border rounded-xl"
          placeholder="Article Title"
        />
      </div>

      <div className="space-y-2">
        <label className="font-bold text-lg">Article Subtitle</label>
        <input
          type="text"
          value={articleSubtitle}
          onChange={(e) => setArticleSubtitle(e.target.value)}
          className="w-full px-4 py-2 border rounded-xl"
          placeholder="Article Subtitle"
        />
      </div>

      <div className="space-y-2">
        <label className="font-bold text-lg">Main Image URL</label>
        <input
          type="text"
          value={articleMainImageUrl}
          onChange={(e) => setArticleMainImageUrl(e.target.value)}
          className="w-full px-4 py-2 border rounded-xl"
          placeholder="image url"
        />
      </div>

      <div className="space-y-2">
        <label className="font-bold text-lg">Company</label>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="w-full px-4 py-2 border rounded-xl"
          placeholder="Company"
        />
      </div>

      <div className="space-y-2">
        <label className="font-bold text-lg">Date *</label>
        <DateInputs
          day={dateDay}
          month={dateMonth}
          year={dateYear}
          onDayChange={(v) => handleDateChange(v, dateMonth, dateYear)}
          onMonthChange={(v) => handleDateChange(dateDay, v, dateYear)}
          onYearChange={(v) => handleDateChange(dateDay, dateMonth, v)}
        />
      </div>

      <div className="space-y-2">
        <label className="font-bold text-lg">Highlighted position</label>
        <select
          value={highlitedPosition}
          onChange={(e) => setHighlitedPosition(e.target.value)}
          className="w-full px-4 py-2 border rounded-xl bg-white"
        >
          {HIGHLITED_POSITION_OPTIONS.map((opt) => (
            <option key={opt.value || "_blank"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="font-bold text-lg">Is this article about an event-fair?</label>
        <select
          value={isArticleEvent ? "yes" : "no"}
          onChange={(e) => {
            const v = e.target.value === "yes";
            setIsArticleEvent(v);
            if (!v) setEventId("");
          }}
          className="w-full px-4 py-2 border rounded-xl bg-white"
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>

      {isArticleEvent && (
        <div className="space-y-2">
          <label className="font-bold text-lg">Event id</label>
          <input
            type="text"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl"
            placeholder="e.g. fair-26-0001"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="font-bold text-lg">Portals * (select at least one)</label>
        <p className="text-sm text-gray-600">
          {highlitedPosition
            ? "When using a highlighted position, only one portal can be selected."
            : "Choose in which portal(s) this article will be published."}
        </p>
        <div className="flex flex-wrap gap-3">
          {portals.length === 0 ? (
            <p className="text-sm text-gray-500">Loading portals...</p>
          ) : (
            portals.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-2 cursor-pointer text-sm border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedPortalIds.includes(p.id)}
                  onChange={() => onTogglePortal(p.id)}
                  className="rounded border-gray-300"
                />
                <span>{p.name}</span>
              </label>
            ))
          )}
        </div>
        {selectedPortalIds.length === 0 && portals.length > 0 && (
          <p className="text-sm text-amber-600">Select at least one portal to continue.</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="font-bold text-lg">Tags</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && onAddTag()}
            className="flex-1 px-4 py-2 border rounded-xl"
            placeholder="Type a tag and press Enter"
          />
          <button
            onClick={onAddTag}
            className="bg-blue-950 text-white px-4 py-2 rounded-xl"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {tagsArray.map((tag, index) => (
            <span
              key={index}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              {tag}
              <button
                onClick={() => onRemoveTag(index)}
                className="text-blue-800 hover:text-blue-950"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          onClick={() => router.push("/logged/pages/articles")}
          className="flex-1 bg-gray-300 py-2 rounded-xl"
        >
          Cancel
        </button>
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`flex-1 py-2 rounded-xl ${
            canGoNext ? "bg-blue-950 text-white" : "bg-gray-300 text-gray-500"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ArticlePhase1;
