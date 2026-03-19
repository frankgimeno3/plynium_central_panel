"use client";

import React, { FC, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CustomerService } from "@/app/service/CustomerService";
import { PmEventService } from "@/app/service/PmEventService";
import { renderMonth } from "./CalendarMonth";
import { ProjectService } from "@/app/service/ProjectService";

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

const PROJECTS_PATH = "/logged/pages/account-management/projects";

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pmEventsFromApi, setPmEventsFromApi] = useState<PmEvent[]>([]);

  useEffect(() => {
    PmEventService.getAllPmEvents()
      .then((list: PmEvent[]) => setPmEventsFromApi(Array.isArray(list) ? list : []))
      .catch(() => setPmEventsFromApi([]));
  }, []);

  useEffect(() => {
    CustomerService.getAllCustomers()
      .then((list: Customer[]) => setCustomers(Array.isArray(list) ? list : []))
      .catch(() => setCustomers([]));
  }, []);
  const loadProjects = useCallback(async () => {
    try {
      const list = await ProjectService.getAllProjects();
      setProjects(Array.isArray(list) ? list : []);
    } catch {
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);
  const [agendaEvents, setAgendaEvents] = useState<PmEvent[]>([]);
  const [agendaFormDate, setAgendaFormDate] = useState("");
  const [agendaFormDescription, setAgendaFormDescription] = useState("");
  const [agendaFormType, setAgendaFormType] = useState<string>("task");

  const allPmEvents = useMemo(
    () => [...pmEventsFromApi].sort((a, b) => (a.date || "").localeCompare(b.date || "")),
    [pmEventsFromApi]
  );
  const allEvents = allPmEvents.filter((e) => e.event_state !== "overdue");
  const combinedEvents = useMemo(() => [...allEvents, ...agendaEvents], [allEvents, agendaEvents]);
  const eventsFromToday = combinedEvents.filter((e) => e.date >= todayDate);
  const eventsForTable = eventsFromToday.length > 0 ? eventsFromToday : combinedEvents;
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

  useEffect(() => {
    if (!addAgendaModalOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setAddAgendaModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [addAgendaModalOpen]);

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
  const eventTypeCardColor: Record<string, string> = { ask_materials: "bg-blue-900/70 text-blue-200 border-blue-600", send_preview: "bg-amber-900/70 text-amber-200 border-amber-600", publication_date: "bg-emerald-900/70 text-emerald-200 border-emerald-600", task: "bg-slate-600/80 text-slate-100 border-slate-500" };

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

  const displayMonth = new Date(currentMonth);
  const agendaTitle = `${MONTH_NAMES[displayMonth.getMonth()]} ${displayMonth.getFullYear()}`;

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
    <div className="flex flex-col gap-8 ">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column: Tasks in agenda */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pt-2">
            <h2 className="text-3xl font-semibold text-slate-100">Tasks in agenda</h2>
            <button
              type="button"
              onClick={() => setAddAgendaModalOpen(true)}
              className="flex min-h-[36px] items-center rounded-md  py-2 px-3 text-sm font-medium uppercase  transition-colors cursor-pointer text-white bg-gray-600/70  hover:bg-gray-600"
            >
              Add agenda event
            </button>
          </div>
          <div className="my-8 flex flex-wrap gap-6 items-end">
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-type" className="text-sm font-medium text-slate-300">Type</label>
              <select id="filter-type" value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-800 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]">
                <option value="">All</option>
                <option value="task">{eventTypeLabel.task}</option>
                <option value="ask_materials">{eventTypeLabel.ask_materials}</option>
                <option value="send_preview">{eventTypeLabel.send_preview}</option>
                <option value="publication_date">{eventTypeLabel.publication_date}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-month" className="text-sm font-medium text-slate-300">Month</label>
              <select id="filter-month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-800 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]">
                <option value="">All</option>
                {MONTH_NAMES.map((name, i) => <option key={name} value={String(i + 1)}>{name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-year" className="text-sm font-medium text-slate-300">Year</label>
              <input id="filter-year" type="text" placeholder="e.g. 2026" value={filterYear} onChange={(e) => setFilterYear(e.target.value.replace(/\D/g, "").slice(0, 4))} className="px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-800 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-24 placeholder-slate-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-project" className="text-sm font-medium text-slate-300">Project</label>
              <input id="filter-project" type="text" placeholder="Project name" value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-800 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[180px] placeholder-slate-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-customer" className="text-sm font-medium text-slate-300">Customer</label>
              <input id="filter-customer" type="text" placeholder="Customer name" value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)} className="px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-800 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[180px] placeholder-slate-500" />
            </div>
          </div>
          <div className="flex flex-row border-b border-slate-600 gap-1 mb-4 ">
            {(["pending", "done"] as EventStateTab[]).map((tab) => (
              <button key={tab} type="button" onClick={() => setEventStateTab(tab)} className={`px-6 py-3 font-medium rounded-t-lg transition-colors capitalize ${eventStateTab === tab ? "bg-blue-600 text-white border-b-2 border-blue-500" : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-slate-100"}`}>{tab}</button>
            ))}
          </div>
          {filteredEventsByTab.length === 0 ? (
            <p className="py-6 text-center text-slate-400 text-sm border border-slate-600 rounded-lg bg-slate-800/50">No events for this state.</p>
          ) : (
            <>
              <div className="overflow-x-auto uppercase">
                <table className="min-w-full divide-y divide-slate-600 border border-slate-600 rounded-lg overflow-hidden">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date (dd mm yyyy)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Customer</th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-800 divide-y divide-slate-600">
                    {paginatedEvents.map((ev) => (
                      <tr
                        key={ev.id_event}
                        onClick={() => { if (ev.id_project !== "agenda") router.push(`${PROJECTS_PATH}/${ev.id_project}`); }}
                        className="hover:bg-slate-700/80 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100" title="dd mm yyyy">{formatDateDdMmYyyy(ev.date)}</td>
                        <td className="px-6 py-4 text-sm text-slate-100">{getProjectTitle(ev.id_project)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{eventTypeLabel[ev.event_type] ?? ev.event_type}</td>
                        <td className="px-6 py-4 text-sm text-slate-100">{getCustomerName(ev.id_customer)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-4 px-2">
                <p className="text-sm text-slate-300">Viewing {paginatedEvents.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredEventsByTab.length)} of {filteredEventsByTab.length}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="px-3 py-1 text-sm font-medium text-slate-200 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">← Prev</button>
                  <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="px-3 py-1 text-sm font-medium text-slate-200 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">Next →</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right column: Agenda calendar */}
        <div className="pl-6 lg:col-span-3">
          {viewMode === "months" ? (
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-center gap-4 mb-4 w-full max-w-7xl mx-auto">
                <button type="button" onClick={() => navigateMonth("prev")} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-full text-2xl text-slate-200" aria-label="Previous month">{'<'}</button>
                <span className="text-2xl font-semibold text-slate-100">{agendaTitle}</span>
                <button type="button" onClick={() => navigateMonth("next")} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-full text-2xl text-slate-200" aria-label="Next month">{'>'}</button>
              </div>
              <div className="w-full">
                <div className="w-full max-w-7xl mx-auto">
                  {renderMonth({
                    month: displayMonth,
                    today,
                    weekDays: WEEK_DAYS,
                    getPmEventsForDate,
                    handleDayClick,
                    eventTypeLabel,
                    eventTypeCardColor,
                    getCustomerName,
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <button type="button" onClick={() => { setViewMode("months"); setSelectedDay(null); }} className="mb-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm self-start text-slate-200">← Back to Calendar</button>
              {selectedDay && (
                <div className="border border-slate-600 rounded-lg p-8 bg-slate-800/50">
                  <div className="flex items-center justify-between mb-6">
                    <button type="button" onClick={() => setSelectedDay(new Date(selectedDay.getTime() - 86400000))} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-200">← Previous Day</button>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-slate-100" title="dd mm yyyy">{formatDateDdMmYyyyFromDate(selectedDay)}</div>
                      <div className="text-xl text-slate-300 capitalize mt-1">{selectedDay.toLocaleDateString("en-US", { weekday: "long" })}</div>
                    </div>
                    <button type="button" onClick={() => setSelectedDay(new Date(selectedDay.getTime() + 86400000))} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-200">Next Day →</button>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-2xl font-bold text-slate-100 mb-4">Tasks in agenda</h3>
                    {getPmEventsForDate(selectedDay).length === 0 ? <p className="text-slate-400">No events scheduled for this day</p> : (
                      <div className="space-y-4">
                        {getPmEventsForDate(selectedDay).map((ev) => (
                          <div
                            key={ev.id_event}
                            onClick={() => { if (ev.id_project !== "agenda") router.push(`${PROJECTS_PATH}/${ev.id_project}`); }}
                            className="border border-slate-600 rounded-lg p-4 hover:bg-slate-700/50 transition-colors cursor-pointer bg-slate-800"
                          >
                            <h4 className="font-semibold text-lg text-slate-100 mb-2 hover:text-blue-300">{getProjectTitle(ev.id_project)}</h4>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${eventTypeCardColor[ev.event_type] ?? "bg-slate-600/80 text-slate-100"}`}>{eventTypeLabel[ev.event_type] ?? ev.event_type}</span>
                            </div>
                            <div className="text-sm text-slate-300">{ev.event_description}</div>
                            <div className="text-xs text-slate-400 mt-2"><span className="font-medium">Customer: </span>{getCustomerName(ev.id_customer)}</div>
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
      </div>

      {addAgendaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setAddAgendaModalOpen(false)}>
          <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-100">Add agenda event</h3>
              <button
                type="button"
                onClick={() => setAddAgendaModalOpen(false)}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-200 rounded-full p-1 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                ×
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="agenda-date" className="block text-sm font-medium text-slate-300 mb-1">Date</label>
                <input
                  id="agenda-date"
                  type="date"
                  value={agendaFormDate}
                  onChange={(e) => setAgendaFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="agenda-desc" className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <input
                  id="agenda-desc"
                  type="text"
                  value={agendaFormDescription}
                  onChange={(e) => setAgendaFormDescription(e.target.value)}
                  placeholder="e.g. Send preview to client"
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="agenda-type" className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                <select
                  id="agenda-type"
                  value={agendaFormType}
                  onChange={(e) => setAgendaFormType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="task">{eventTypeLabel.task}</option>
                  <option value="ask_materials">{eventTypeLabel.ask_materials}</option>
                  <option value="send_preview">{eventTypeLabel.send_preview}</option>
                  <option value="publication_date">{eventTypeLabel.publication_date}</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setAddAgendaModalOpen(false)} className="px-4 py-2 bg-slate-600 text-slate-100 rounded-lg hover:bg-slate-500 font-medium">
                Cancel
              </button>
              <button type="button" onClick={handleAddAgendaEvent} disabled={!agendaFormDate.trim() || !agendaFormDescription.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
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
