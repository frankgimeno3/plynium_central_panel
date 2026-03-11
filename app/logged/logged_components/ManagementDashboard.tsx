"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import pmEventsData from "@/app/contents/pm_events.json";
import customersData from "@/app/contents/customers.json";
import projectsData from "@/app/contents/projects.json";

type PmEvent = {
  id_event: string;
  id_project: string;
  id_customer: string;
  event_type: string;
  date: string;
  event_description: string;
  event_state: string;
};

type Customer = { id_customer: string; name: string };
type Project = { id_project: string; title: string };

const PROJECTS_PATH = "/logged/pages/production/projects";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatDateDdMmYyyy = (dateStr: string) => {
  const parts = (dateStr || "").split("T")[0].split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${String(parseInt(d, 10)).padStart(2, "0")} ${String(parseInt(m, 10)).padStart(2, "0")} ${y}`;
};

const formatDateDdMmYyyyFromDate = (date: Date) => {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  return `${String(d).padStart(2, "0")} ${String(m).padStart(2, "0")} ${y}`;
};

type EventStateTab = "done" | "pending";
const PAGE_SIZE = 12;

const ManagementDashboard: FC = () => {
  const router = useRouter();
  const todayDate = todayStr();
  const [eventStateTab, setEventStateTab] = useState<EventStateTab>("pending");
  const [filterType, setFilterType] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [addAgendaModalOpen, setAddAgendaModalOpen] = useState(false);
  const [agendaEvents, setAgendaEvents] = useState<PmEvent[]>([]);
  const [agendaFormDate, setAgendaFormDate] = useState("");
  const [agendaFormDescription, setAgendaFormDescription] = useState("");
  const [agendaFormType, setAgendaFormType] = useState<string>("task");

  const allPmEvents = (pmEventsData as PmEvent[]).slice().sort((a, b) => a.date.localeCompare(b.date));
  const allEvents = allPmEvents.filter((e) => e.event_state !== "overdue");
  const combinedEvents = useMemo(() => [...allEvents, ...agendaEvents], [allEvents, agendaEvents]);
  const eventsFromToday = combinedEvents.filter((e) => e.date >= todayDate);
  const eventsForTable = eventsFromToday.length > 0 ? eventsFromToday : combinedEvents;
  const customers = customersData as Customer[];
  const projects = projectsData as Project[];

  const getProjectTitle = (id: string) => (id === "agenda" ? "Agenda" : projects.find((p) => p.id_project === id)?.title ?? id);

  const eventsByTab = useMemo(() => eventsForTable.filter((e) => e.event_state === eventStateTab), [eventsForTable, eventStateTab]);

  const filteredEventsByTab = useMemo(() => {
    let result = eventsByTab;
    if (filterType) result = result.filter((e) => e.event_type === filterType);
    if (filterMonth || filterYear.trim()) {
      const monthNum = filterMonth ? parseInt(filterMonth, 10) : null;
      const yearNum = filterYear.trim() ? parseInt(filterYear.trim(), 10) : null;
      if ((monthNum === null || (monthNum >= 1 && monthNum <= 12)) && (yearNum === null || (yearNum >= 1000 && yearNum <= 9999))) {
        result = result.filter((e) => {
          const eventDateStr = (e.date || "").split("T")[0];
          if (!eventDateStr || eventDateStr.length < 10) return false;
          const eventYear = parseInt(eventDateStr.slice(0, 4), 10);
          const eventMonth = parseInt(eventDateStr.slice(5, 7), 10);
          return (!monthNum || eventMonth === monthNum) && (!yearNum || eventYear === yearNum);
        });
      }
    }
    const projQ = filterProject.trim().toLowerCase();
    if (projQ) result = result.filter((e) => (projects.find((p) => p.id_project === e.id_project)?.title ?? e.id_project).toLowerCase().includes(projQ));
    const custQ = filterCustomer.trim().toLowerCase();
    if (custQ) result = result.filter((e) => (customers.find((c) => c.id_customer === e.id_customer)?.name ?? e.id_customer).toLowerCase().includes(custQ));
    return result;
  }, [eventsByTab, filterType, filterMonth, filterYear, filterProject, filterCustomer, projects, customers]);

  const totalPages = Math.max(1, Math.ceil(filteredEventsByTab.length / PAGE_SIZE));
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredEventsByTab.slice(start, start + PAGE_SIZE);
  }, [filteredEventsByTab, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [filterType, filterMonth, filterYear, filterProject, filterCustomer, eventStateTab]);

  const getCustomerName = (id: string) => (id === "-" ? "—" : customers.find((c) => c.id_customer === id)?.name ?? id);
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [viewMode, setViewMode] = useState<"months" | "day">("months");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const formatDateKeyFromDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => { const next = new Date(prev); direction === "prev" ? next.setMonth(next.getMonth() - 1) : next.setMonth(next.getMonth() + 1); return next; });
  };

  const handleDayClick = (date: Date) => { setSelectedDay(date); setViewMode("day"); };

  const eventTypeLabel: Record<string, string> = { ask_materials: "Ask materials", send_preview: "Send preview", publication_date: "Publication date", task: "Task" };
  const eventTypeCardColor: Record<string, string> = { ask_materials: "bg-blue-200 text-blue-900 border-blue-300", send_preview: "bg-amber-200 text-amber-900 border-amber-300", publication_date: "bg-emerald-200 text-emerald-900 border-emerald-300", task: "bg-slate-200 text-slate-900 border-slate-300" };

  const eventsByDateAndType = useMemo(() => {
    const combined = [...allEvents, ...agendaEvents];
    const map = new Map<string, Map<string, PmEvent[]>>();
    combined.forEach((e) => {
      const dateKey = (e.date || "").split("T")[0];
      if (!dateKey) return;
      let byType = map.get(dateKey);
      if (!byType) { byType = new Map(); map.set(dateKey, byType); }
      const list = byType.get(e.event_type) ?? [];
      list.push(e);
      byType.set(e.event_type, list);
    });
    return map;
  }, [allEvents, agendaEvents]);

  const getPmEventsForDate = (date: Date) => {
    const key = formatDateKeyFromDate(date);
    const byType = eventsByDateAndType.get(key);
    return byType ? Array.from(byType.values()).flat() : [];
  };

  const renderMonth = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days: (number | null)[] = [...Array(startingDayOfWeek).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    const weeks: (number | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

    return (
      <div className="flex flex-col">
        <div className="text-center mb-4"><h3 className="text-xl font-semibold text-gray-900">{MONTH_NAMES[monthIndex]} {year}</h3></div>
        <div className="grid grid-cols-7 gap-1 mb-2">{WEEK_DAYS.map((day) => <div key={day} className="text-center text-sm font-medium text-gray-600 py-1">{day}</div>)}</div>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => {
              if (day === null) return <div key={dayIndex} className="aspect-square" />;
              const date = new Date(year, monthIndex, day);
              const dayEvents = getPmEventsForDate(date);
              const hasEvents = dayEvents.length > 0;
              const isToday = year === today.getFullYear() && monthIndex === today.getMonth() && day === today.getDate();
              return (
                <div key={dayIndex} onClick={() => handleDayClick(date)} className={`aspect-square border rounded p-1 text-sm flex flex-col relative cursor-pointer transition-all hover:shadow-md ${isToday ? "ring-1 ring-blue-600" : "border-gray-200"}`}>
                  <div className={`font-medium shrink-0 ${isToday ? "text-blue-600" : ""}`}>{day}</div>
                  {hasEvents && (
                    <div className="flex-1 flex flex-col gap-0.5 mt-1 overflow-hidden overflow-y-auto">
                      {dayEvents.map((ev) => (
                        <div key={ev.id_event} className={`px-1 py-0.5 rounded text-xs font-medium border truncate ${eventTypeCardColor[ev.event_type] ?? "bg-gray-200 text-gray-800 border-gray-300"}`} title={`${eventTypeLabel[ev.event_type] ?? ev.event_type} - ${getCustomerName(ev.id_customer)}`}>
                          {eventTypeLabel[ev.event_type] ?? ev.event_type} - {getCustomerName(ev.id_customer)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const month1 = new Date(currentMonth);
  const month2 = new Date(currentMonth);
  month2.setMonth(month2.getMonth() + 1);
  const month1Name = MONTH_NAMES[month1.getMonth()];
  const month2Name = MONTH_NAMES[month2.getMonth()];
  const year1 = month1.getFullYear();
  const year2 = month2.getFullYear();
  const agendaTitle =
    year1 === year2
      ? `Personal agenda for months ${month1Name} and ${month2Name}, ${year1}`
      : `Personal agenda for months ${month1Name} ${year1} and ${month2Name} ${year2}`;

  const handleAddAgendaEvent = () => {
    const dateStr = (agendaFormDate || "").trim();
    const desc = (agendaFormDescription || "").trim();
    if (!dateStr || !desc) return;
    const newEvent: PmEvent = {
      id_event: `agenda-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      id_project: "agenda",
      id_customer: "-",
      event_type: agendaFormType || "task",
      date: dateStr,
      event_description: desc,
      event_state: "pending",
    };
    setAgendaEvents((prev) => [...prev, newEvent]);
    setAgendaFormDate("");
    setAgendaFormDescription("");
    setAgendaFormType("task");
    setAddAgendaModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {viewMode === "months" ? (
          <div className="flex flex-col w-full">
            <div className="flex items-center justify-center gap-4 mb-4 w-full">
              <button type="button" onClick={() => navigateMonth("prev")} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm" aria-label="Previous months">←</button>
              <span className="text-2xl font-semibold text-gray-800">{agendaTitle}</span>
              <button type="button" onClick={() => navigateMonth("next")} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm" aria-label="Next months">→</button>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                {renderMonth(month1)}
              </div>
              <div className="flex-1">
                {renderMonth(month2)}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <button type="button" onClick={() => { setViewMode("months"); setSelectedDay(null); }} className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm self-start">← Back to Calendar</button>
            {selectedDay && (
              <div className="border border-gray-200 rounded-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <button type="button" onClick={() => setSelectedDay(new Date(selectedDay.getTime() - 86400000))} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm">← Previous Day</button>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900" title="dd mm yyyy">{formatDateDdMmYyyyFromDate(selectedDay)}</div>
                    <div className="text-xl text-gray-600 capitalize mt-1">{selectedDay.toLocaleDateString("en-US", { weekday: "long" })}</div>
                  </div>
                  <button type="button" onClick={() => setSelectedDay(new Date(selectedDay.getTime() + 86400000))} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm">Next Day →</button>
                </div>
                <div className="mt-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Tasks in agenda</h3>
                  {getPmEventsForDate(selectedDay).length === 0 ? <p className="text-gray-500">No events scheduled for this day</p> : (
                    <div className="space-y-4">
                      {getPmEventsForDate(selectedDay).map((ev) => (
                        <div
                          key={ev.id_event}
                          onClick={() => { if (ev.id_project !== "agenda") router.push(`${PROJECTS_PATH}/${ev.id_project}`); }}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:bg-blue-50/50"
                        >
                          <h4 className="font-semibold text-lg text-gray-900 mb-2 hover:text-blue-600">{getProjectTitle(ev.id_project)}</h4>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${eventTypeCardColor[ev.event_type] ?? "bg-gray-200 text-gray-800"}`}>{eventTypeLabel[ev.event_type] ?? ev.event_type}</span>
                          </div>
                          <div className="text-sm text-gray-600">{ev.event_description}</div>
                          <div className="text-xs text-gray-500 mt-2"><span className="font-medium">Customer: </span>{getCustomerName(ev.id_customer)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Tasks in agenda</h2>
          <button
            type="button"
            onClick={() => setAddAgendaModalOpen(true)}
            className="px-4 py-2 bg-blue-950 text-white text-sm font-medium rounded-xl hover:bg-blue-900"
          >
            Add agenda event
          </button>
        </div>
        <div className="mb-4 flex flex-wrap gap-6 items-end">
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-type" className="text-sm font-medium text-gray-700">Type</label>
            <select id="filter-type" value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]">
              <option value="">All</option>
              <option value="task">{eventTypeLabel.task}</option>
              <option value="ask_materials">{eventTypeLabel.ask_materials}</option>
              <option value="send_preview">{eventTypeLabel.send_preview}</option>
              <option value="publication_date">{eventTypeLabel.publication_date}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-month" className="text-sm font-medium text-gray-700">Month</label>
            <select id="filter-month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]">
              <option value="">All</option>
              {MONTH_NAMES.map((name, i) => <option key={name} value={String(i + 1)}>{name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-year" className="text-sm font-medium text-gray-700">Year</label>
            <input id="filter-year" type="text" placeholder="e.g. 2026" value={filterYear} onChange={(e) => setFilterYear(e.target.value.replace(/\D/g, "").slice(0, 4))} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-24" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-project" className="text-sm font-medium text-gray-700">Project</label>
            <input id="filter-project" type="text" placeholder="Project name" value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[180px]" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-customer" className="text-sm font-medium text-gray-700">Customer</label>
            <input id="filter-customer" type="text" placeholder="Customer name" value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[180px]" />
          </div>
        </div>
        <div className="flex flex-row border-b border-gray-200 gap-1 mb-4">
          {(["pending", "done"] as EventStateTab[]).map((tab) => (
            <button key={tab} type="button" onClick={() => setEventStateTab(tab)} className={`px-6 py-3 font-medium rounded-t-lg transition-colors capitalize ${eventStateTab === tab ? "bg-blue-500 text-white border-b-2 border-blue-500" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{tab}</button>
          ))}
        </div>
        {filteredEventsByTab.length === 0 ? (
          <p className="py-6 text-center text-gray-500 text-sm border border-gray-200 rounded-lg bg-gray-50">No events for this state.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date (dd mm yyyy)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedEvents.map((ev) => (
                    <tr
                      key={ev.id_event}
                      onClick={() => { if (ev.id_project !== "agenda") router.push(`${PROJECTS_PATH}/${ev.id_project}`); }}
                      className="hover:bg-blue-50/80 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" title="dd mm yyyy">{formatDateDdMmYyyy(ev.date)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{getProjectTitle(ev.id_project)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{eventTypeLabel[ev.event_type] ?? ev.event_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{getCustomerName(ev.id_customer)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4 px-2">
              <p className="text-sm text-gray-600">Viewing {paginatedEvents.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredEventsByTab.length)} of {filteredEventsByTab.length}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">← Prev</button>
                <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">Next →</button>
              </div>
            </div>
          </>
        )}
      </div>

      {addAgendaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setAddAgendaModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Add agenda event</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="agenda-date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  id="agenda-date"
                  type="date"
                  value={agendaFormDate}
                  onChange={(e) => setAgendaFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="agenda-desc" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  id="agenda-desc"
                  type="text"
                  value={agendaFormDescription}
                  onChange={(e) => setAgendaFormDescription(e.target.value)}
                  placeholder="e.g. Send preview to client"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="agenda-type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  id="agenda-type"
                  value={agendaFormType}
                  onChange={(e) => setAgendaFormType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="task">{eventTypeLabel.task}</option>
                  <option value="ask_materials">{eventTypeLabel.ask_materials}</option>
                  <option value="send_preview">{eventTypeLabel.send_preview}</option>
                  <option value="publication_date">{eventTypeLabel.publication_date}</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setAddAgendaModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium">
                Cancel
              </button>
              <button type="button" onClick={handleAddAgendaEvent} disabled={!agendaFormDate.trim() || !agendaFormDescription.trim()} className="px-4 py-2 bg-blue-950 text-white rounded-lg hover:bg-blue-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                Add to calendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementDashboard;
