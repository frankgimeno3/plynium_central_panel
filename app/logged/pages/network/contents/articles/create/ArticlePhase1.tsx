"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DateInputs, parseDateFields, buildDateStr } from "@/app/logged/logged_components/date_components/DateInputs";
import CompaniesDbSelectModal from "@/app/logged/logged_components/modals/CompaniesDbSelectModal";

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
  onOpenMediaLibrary: () => void;
  companyPairs: { name: string; id: string }[];
  onAddCompanyPair: (name: string, id: string) => void;
  onRemoveCompanyPair: (index: number) => void;
  isArticleRelatedToCompany: boolean;
  setIsArticleRelatedToCompany: (v: boolean) => void;
  date: string;
  setDate: (v: string) => void;
  highlitedPosition: string;
  setHighlitedPosition: (v: string) => void;
  isArticleEvent: boolean;
  setIsArticleEvent: (v: boolean) => void;
  eventId: string;
  setEventId: (v: string) => void;
  onOpenEventSelect: () => void;
  tags: string;
  setTags: (v: string) => void;
  tagsArray: string[];
  portals: { id: number; name: string }[];
  selectedPortalIds: number[];
  onTogglePortal: (portalId: number) => void;
  portalTopics: { topic_id: number; topic_name: string }[];
  topicsLoading: boolean;
  selectedTopicIds: number[];
  onToggleTopic: (topicId: number) => void;
  onAddTag: () => void;
  onRemoveTag: (index: number) => void;
  /** ISO date yyyy-mm-dd from fields (must match what user sees in Day/Month/Year) */
  onNext: (resolvedDate: string) => void;
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
  onOpenMediaLibrary,
  companyPairs,
  onAddCompanyPair,
  onRemoveCompanyPair,
  isArticleRelatedToCompany,
  setIsArticleRelatedToCompany,
  date,
  setDate,
  highlitedPosition,
  setHighlitedPosition,
  isArticleEvent,
  setIsArticleEvent,
  eventId,
  setEventId,
  onOpenEventSelect,
  tags,
  setTags,
  tagsArray,
  portals,
  selectedPortalIds,
  onTogglePortal,
  portalTopics,
  topicsLoading,
  selectedTopicIds,
  onToggleTopic,
  onAddTag,
  onRemoveTag,
  onNext,
}) => {
  const router = useRouter();
  const [companiesDbModalOpen, setCompaniesDbModalOpen] = useState(false);
  const [manualAddOpen, setManualAddOpen] = useState(false);
  const [manualCompanyName, setManualCompanyName] = useState("");
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
    const built = buildDateStr(day, month, year);
    setDate(built);
  };

  /** Single source for “is date OK?” — avoids parent `date` lagging behind the three inputs on Next click */
  const resolvedArticleDate =
    buildDateStr(dateDay, dateMonth, dateYear) || (typeof date === "string" ? date.trim() : "");

  const portalId = (p: { id: number }) => {
    const n = Number(p.id);
    return Number.isFinite(n) ? n : NaN;
  };

  const canGoNext =
    !isGeneratingId &&
    !!articleTitle?.trim() &&
    !!resolvedArticleDate &&
    (!isArticleRelatedToCompany ||
      (companyPairs.length >= 1 && companyPairs.every((p) => p.name.trim()))) &&
    selectedPortalIds.length >= 1;

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
        <label className="font-bold text-lg">Main Image</label>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onOpenMediaLibrary}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-700 hover:border-blue-950 hover:bg-blue-50/30 transition-colors font-medium"
          >
            Select or add image from Media Library
          </button>
          {articleMainImageUrl && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <img
                src={articleMainImageUrl}
                alt="Main"
                className="w-16 h-16 object-cover rounded border border-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="text-sm text-gray-600 truncate flex-1 min-w-0" title={articleMainImageUrl}>
                {articleMainImageUrl}
              </span>
              <button
                type="button"
                onClick={() => setArticleMainImageUrl("")}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="font-bold text-lg">Companies</label>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-gray-600">Is this article related to a company?</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const next = !isArticleRelatedToCompany;
                setIsArticleRelatedToCompany(next);
                if (!next) setManualAddOpen(false);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isArticleRelatedToCompany ? "bg-blue-950" : "bg-gray-300"
              }`}
              role="switch"
              aria-checked={isArticleRelatedToCompany}
              aria-label="Is this article related to a company?"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isArticleRelatedToCompany ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-800">
              {isArticleRelatedToCompany ? "Yes" : "No"}
            </span>
          </div>

          {isArticleRelatedToCompany && (
            <>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCompaniesDbModalOpen(true)}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-800 font-medium hover:bg-gray-50"
                >
                  [+] Add a company from the companies DB
                </button>
                <button
                  type="button"
                  onClick={() => setManualAddOpen((v) => !v)}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-800 font-medium hover:bg-gray-50"
                >
                  [+] Add a company name with no redirection
                </button>
              </div>

              {manualAddOpen && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={manualCompanyName}
                    onChange={(e) => setManualCompanyName(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-xl"
                    placeholder="Company name"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const n = manualCompanyName.trim();
                      if (!n) return;
                      const already = companyPairs.some(
                        (p) => !p.id && p.name.trim().toLowerCase() === n.toLowerCase()
                      );
                      if (!already) onAddCompanyPair(n, "");
                      setManualCompanyName("");
                      setManualAddOpen(false);
                    }}
                    disabled={!manualCompanyName.trim()}
                    className="px-4 py-2 rounded-xl bg-blue-950 text-white disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 pt-2">
                {companyPairs.length === 0 ? (
                  <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    Add at least one company to continue.
                  </div>
                ) : (
                  companyPairs.map((p, i) => {
                    const fromDb = !!p.id?.trim();
                    return (
                      <div
                        key={`${p.name}-${p.id}-${i}`}
                        className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{p.name}</div>
                          <div className="text-sm text-gray-600">
                            {fromDb ? (
                              <>
                                From companies DB ·{" "}
                                <span className="font-mono text-xs text-gray-700">ID: {p.id}</span>
                              </>
                            ) : (
                              "Manually added"
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveCompanyPair(i)}
                          className="shrink-0 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                          aria-label="Remove company"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <CompaniesDbSelectModal
                open={companiesDbModalOpen}
                onClose={() => setCompaniesDbModalOpen(false)}
                onSelectCompany={({ companyId, commercialName }) => {
                  const id = (companyId ?? "").trim();
                  const name = (commercialName ?? "").trim() || id;
                  if (!id || !name) return;
                  const already = companyPairs.some(
                    (p) => p.id.trim().toLowerCase() === id.toLowerCase()
                  );
                  if (!already) onAddCompanyPair(name, id);
                }}
              />
            </>
          )}
        </div>
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
          <label className="font-bold text-lg">Event</label>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onOpenEventSelect}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-700 hover:border-blue-950 hover:bg-blue-50/30 transition-colors font-medium"
            >
              Select event from list
            </button>
            {eventId && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-sm font-mono text-gray-800">{eventId}</span>
                <button
                  type="button"
                  onClick={() => setEventId("")}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
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
            portals.map((p, idx) => {
              const pid = portalId(p);
              return (
              <label
                key={Number.isFinite(pid) ? `portal-${pid}` : `portal-${idx}-${p.name}`}
                className="flex items-center gap-2 cursor-pointer text-sm border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={Number.isFinite(pid) && selectedPortalIds.includes(pid)}
                  onChange={() => {
                    if (Number.isFinite(pid)) onTogglePortal(pid);
                  }}
                  className="rounded border-gray-300"
                />
                <span>{p.name}</span>
              </label>
            );
            })
          )}
        </div>
        {selectedPortalIds.length === 0 && portals.length > 0 && (
          <p className="text-sm text-amber-600">Select at least one portal to continue.</p>
        )}
      </div>

      {selectedPortalIds.length > 0 && (
        <div className="space-y-2">
          <label className="font-bold text-lg">Content topics (optional)</label>
          <p className="text-sm text-gray-600">
            Tags from <span className="font-medium">topics_db</span> for the portal(s) you selected. Each topic
            belongs to one portal; only topics for your selection are listed.
          </p>
          {topicsLoading ? (
            <p className="text-sm text-gray-500">Loading topics…</p>
          ) : portalTopics.length === 0 ? (
            <p className="text-sm text-gray-500">
              No topics configured for the selected portal(s) in the database.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-gray-50/80 p-3">
              {portalTopics.map((t) => (
                <label
                  key={t.topic_id}
                  className="flex items-center gap-2 cursor-pointer text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedTopicIds.includes(t.topic_id)}
                    onChange={() => onToggleTopic(t.topic_id)}
                    className="rounded border-gray-300"
                  />
                  <span>{t.topic_name}</span>
                  <span className="text-xs text-gray-400 font-mono">#{t.topic_id}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

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
          type="button"
          onClick={() => router.push("/logged/pages/account-management/contents/articles")}
          className="flex-1 bg-gray-300 py-2 rounded-xl"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onNext(resolvedArticleDate)}
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
