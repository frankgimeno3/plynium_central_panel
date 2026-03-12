'use client';

import React, { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { usePageContent } from '@/app/logged/logged_components/context_content/PageContentContext';
import PageContentSection from '@/app/logged/logged_components/context_content/PageContentSection';
import CustomerSelectModal, { type CustomerRow } from '@/app/logged/logged_components/modals/CustomerSelectModal';
import MediatecaModal from '@/app/logged/logged_components/modals/MediatecaModal';
import EventSelectModal from '@/app/logged/logged_components/modals/EventSelectModal';
import { EventsService } from '@/app/service/EventsService';
import { PortalService } from '@/app/service/PortalService';
import { ArticleService } from '@/app/service/ArticleService';
import customersData from '@/app/contents/customers.json';

const REGIONS = [
  'EUROPE',
  'AFRICA',
  'ASIA',
  'INDIA',
  'CHINA',
  'OCEANIA',
  'NORTH AMERICA',
  'LATAM',
] as const;

type Region = (typeof REGIONS)[number];

interface Event {
  id_fair: string;
  event_name: string;
  country: string;
  main_description: string;
  region: string;
  start_date: string;
  end_date: string;
  location: string;
  event_main_image?: string;
  id_customer?: string | null;
}

const customersList = (customersData as CustomerRow[]).filter(
  (c) => c && typeof c.id_customer === 'string'
);
function getCustomerById(id: string | null | undefined): CustomerRow | null {
  if (!id) return null;
  return customersList.find((c) => c.id_customer === id) ?? null;
}

function normalizeDateForInput(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
}

function parseDateFields(dateStr: string): { day: string; month: string; year: string } {
  const norm = normalizeDateForInput(dateStr);
  if (!norm || norm.length < 10) return { day: '', month: '', year: '' };
  const [y, m, d] = norm.split('-');
  return {
    day: d ? String(parseInt(d, 10) || '') : '',
    month: m ? String(parseInt(m, 10) || '') : '',
    year: y || '',
  };
}

function buildDateStr(day: string, month: string, year: string): string {
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (!day || !month || !year || isNaN(d) || isNaN(m) || isNaN(y)) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return '';
  return `${y}-${pad(m)}-${pad(Math.min(d, new Date(y, m, 0).getDate()))}`;
}

function DateInputs({
  day,
  month,
  year,
  onDayChange,
  onMonthChange,
  onYearChange,
}: {
  day: string;
  month: string;
  year: string;
  onDayChange: (v: string) => void;
  onMonthChange: (v: string) => void;
  onYearChange: (v: string) => void;
}) {
  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  return (
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Day</label>
        <input
          type="number"
          min={1}
          max={31}
          placeholder="DD"
          value={day}
          onChange={(e) => onDayChange(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
        <input
          type="number"
          min={1}
          max={12}
          placeholder="MM"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
        <input
          type="number"
          min={1900}
          max={2100}
          placeholder="YYYY"
          value={year}
          onChange={(e) => onYearChange(e.target.value)}
          className={inputClass}
        />
      </div>
    </div>
  );
}

function normalizeRegion(region: string): Region {
  const upper = region.toUpperCase().trim();
  const map: Record<string, Region> = {
    EUROPE: 'EUROPE',
    AFRICA: 'AFRICA',
    ASIA: 'ASIA',
    INDIA: 'INDIA',
    CHINA: 'CHINA',
    OCEANIA: 'OCEANIA',
    'NORTH AMERICA': 'NORTH AMERICA',
    'NOTH AMERICA': 'NORTH AMERICA',
    LATAM: 'LATAM',
    'LATIN AMERICA': 'LATAM',
    GLOBAL: 'EUROPE',
  };
  return map[upper] ?? (REGIONS.includes(upper as Region) ? (upper as Region) : 'EUROPE');
}

function isValidUrl(s: string): boolean {
  const trimmed = s.trim();
  if (!trimmed) return true;
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

function ImagePlaceholderSvg() {
  return (
    <svg
      className="w-12 h-12 text-gray-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

const IdEvent: FC = () => {
  const params = useParams();
  const router = useRouter();
  const { setPageMeta } = usePageContent();
  const eventId = params?.id_event as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState('');
  const [country, setCountry] = useState('');
  const [location, setLocation] = useState('');
  const [mainDescription, setMainDescription] = useState('');
  const [region, setRegion] = useState<Region>('EUROPE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startDay, setStartDay] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endDay, setEndDay] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [endYear, setEndYear] = useState('');
  const [eventMainImage, setEventMainImage] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [eventPortals, setEventPortals] = useState<{ portalId: number; portalName: string; slug: string; status: string }[]>([]);
  const [allPortals, setAllPortals] = useState<{ id: number; name: string }[]>([]);
  const [portalActionLoading, setPortalActionLoading] = useState(false);
  const [eventArticles, setEventArticles] = useState<{ id_article: string; articleTitle: string; date?: string }[]>([]);
  const [relatedCustomer, setRelatedCustomer] = useState<CustomerRow | null>(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [mediatecaOpen, setMediatecaOpen] = useState(false);
  const [previousEditionOn, setPreviousEditionOn] = useState(false);
  const [previousEditionEvent, setPreviousEditionEvent] = useState<Event | null>(null);
  const [previousEditionModalOpen, setPreviousEditionModalOpen] = useState(false);

  /** Snapshot of form values when event was loaded (or after save). Used to show floating Save only when there are changes. */
  const [initialFormSnapshot, setInitialFormSnapshot] = useState<{
    eventName: string;
    country: string;
    location: string;
    mainDescription: string;
    region: string;
    startDate: string;
    endDate: string;
    eventMainImage: string;
    idCustomer: string | null;
  } | null>(null);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [data, portals, eventPortalsList] = await Promise.all([
          EventsService.getEventById(eventId),
          PortalService.getAllPortals(),
          EventsService.getEventPortals(eventId).catch(() => []),
        ]);
        if (!cancelled) {
          setEvent(data);
          setEventName(data.event_name);
          setCountry(data.country ?? '');
          setLocation(data.location ?? '');
          setMainDescription(data.main_description ?? '');
          setRegion(normalizeRegion(data.region ?? ''));
          setStartDate(normalizeDateForInput(data.start_date));
          setEndDate(normalizeDateForInput(data.end_date));
          setEventMainImage(data.event_main_image ?? '');
          setImageLoadError(false);
          setAllPortals(
            Array.isArray(portals)
              ? portals.map((p: any) => ({ id: p.id, name: p.name ?? String(p.key ?? p.id) }))
              : []
          );
          setEventPortals(Array.isArray(eventPortalsList) ? eventPortalsList : []);
          setRelatedCustomer(getCustomerById(data.id_customer));
        }
        if (!cancelled) {
          const start = normalizeDateForInput(data.start_date);
          const end = normalizeDateForInput(data.end_date);
          setInitialFormSnapshot({
            eventName: data.event_name,
            country: data.country ?? '',
            location: data.location ?? '',
            mainDescription: data.main_description ?? '',
            region: normalizeRegion(data.region ?? ''),
            startDate: start,
            endDate: end,
            eventMainImage: data.event_main_image ?? '',
            idCustomer: data.id_customer ?? null,
          });
        }
      } catch (err) {
        console.error('Error loading event:', err);
        if (!cancelled) setEvent(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    const s = parseDateFields(startDate);
    const isComplete = s.day !== '' && s.month !== '' && s.year.length >= 4 && /^\d{4}-\d{2}-\d{2}$/.test(startDate.trim());
    if (isComplete) {
      setStartDay(s.day);
      setStartMonth(s.month);
      setStartYear(s.year);
    }
  }, [startDate]);

  useEffect(() => {
    const s = parseDateFields(endDate);
    const isComplete = s.day !== '' && s.month !== '' && s.year.length >= 4 && /^\d{4}-\d{2}-\d{2}$/.test(endDate.trim());
    if (isComplete) {
      setEndDay(s.day);
      setEndMonth(s.month);
      setEndYear(s.year);
    }
  }, [endDate]);

  useEffect(() => {
    if (!event) return;
    const prevTitle = (eventName || event.event_name || '').trim();
    const yearY = startYear || (startDate && startDate.length >= 4 ? startDate.split('-')[0] : '');
    const definitiveTitle = yearY ? `${prevTitle} ${yearY}`.trim() : prevTitle || 'Edit Event';
    setPageMeta({
      pageTitle: definitiveTitle,
      breadcrumbs: [
        { label: 'Contents' },
        { label: 'Events', href: '/logged/pages/network/contents/events' },
        { label: definitiveTitle },
      ],
      buttons: [],
    });
  }, [event, eventName, startDate, startYear, setPageMeta]);

  useEffect(() => {
    if (!eventId || !event) return;
    let cancelled = false;
    (async () => {
      try {
        const all = await ArticleService.getAllArticles();
        const raw = Array.isArray(all) ? all : [];
        const list = raw
          .filter((a: { event_id?: string; eventId?: string }) => {
            const eid = (a.event_id ?? a.eventId ?? '').toString().trim();
            return eid === eventId;
          })
          .map((a: { id_article: string; articleTitle?: string; article_title?: string; date?: string }) => ({
            id_article: a.id_article,
            articleTitle: (a.articleTitle ?? a.article_title ?? '') || '',
            date: a.date,
          }))
          .sort((a, b) => {
            const dA = a.date ? new Date(a.date).getTime() : 0;
            const dB = b.date ? new Date(b.date).getTime() : 0;
            return dB - dA;
          });
        if (!cancelled) setEventArticles(list);
      } catch {
        if (!cancelled) setEventArticles([]);
      }
    })();
    return () => { cancelled = true; };
  }, [eventId, event]);

  const handleStartDateChange = (day: string, month: string, year: string) => {
    setStartDay(day);
    setStartMonth(month);
    setStartYear(year);
    setStartDate(buildDateStr(day, month, year));
  };

  const handleEndDateChange = (day: string, month: string, year: string) => {
    setEndDay(day);
    setEndMonth(month);
    setEndYear(year);
    setEndDate(buildDateStr(day, month, year));
  };

  if (!eventId) {
    return (
      <div className="flex flex-col w-full h-full min-h-screen text-gray-600 px-6 py-10 gap-6 items-center justify-center">
        <p className="text-red-500 text-lg">Invalid event</p>
        <button
          onClick={() => router.push('/logged/pages/network/contents/events')}
          className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl"
        >
          Back to Events
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col w-full min-h-screen bg-white px-6 py-10">
        <button
          onClick={() => router.push('/logged/pages/network/contents/events')}
          className="mb-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm self-start"
        >
          ← Back to Events
        </button>
        <p className="text-gray-500">Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col w-full h-full min-h-screen text-gray-600 px-6 py-10 gap-6 items-center justify-center">
        <p className="text-red-500 text-lg">The event you are looking for doesn&apos;t exist.</p>
        <button
          onClick={() => router.push('/logged/pages/network/contents/events')}
          className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl"
        >
          Back to Events
        </button>
      </div>
    );
  }

  const getDuration = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffTime = end.getTime() - start.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
  };

  const handleSaveClick = () => {
    setShowSaveModal(true);
  };

  const handleSaveConfirm = async () => {
    const imageUrl = eventMainImage.trim();
    if (imageUrl && !isValidUrl(imageUrl)) {
      alert('The main image URL is invalid. Please select an image from the mediateca again.');
      return;
    }
    setSaving(true);
    try {
      await EventsService.updateEvent(event.id_fair, {
        event_name: eventName,
        country: country,
        location: location,
        main_description: mainDescription,
        region: region,
        start_date: startDate,
        end_date: endDate,
        event_main_image: eventMainImage.trim(),
        id_customer: relatedCustomer?.id_customer ?? null,
      });
      setShowSaveModal(false);
      setImageLoadError(false);
      router.refresh();
      setInitialFormSnapshot({
        eventName: eventName,
        country: country,
        location: location,
        mainDescription: mainDescription,
        region: region,
        startDate: startDate,
        endDate: endDate,
        eventMainImage: eventMainImage.trim(),
        idCustomer: relatedCustomer?.id_customer ?? null,
      });
    } catch (err) {
      console.error('Error saving event:', err);
      const msg =
        typeof err === 'string'
          ? err
          : (err as { message?: string })?.message ||
            (err as { data?: { message?: string } })?.data?.message ||
            'Error saving event';
      alert(`Error saving: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCancel = () => {
    setShowSaveModal(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await EventsService.deleteEvent(event.id_fair);
      setShowDeleteModal(false);
      router.push('/logged/pages/account-management/contents/events');
      router.refresh();
    } catch (err) {
      console.error('Error deleting event:', err);
      const msg =
        typeof err === 'string'
          ? err
          : (err as { message?: string })?.message ||
            (err as { data?: { message?: string } })?.data?.message ||
            'Error deleting event';
      alert(`Error deleting: ${msg}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const showImagePreview = eventMainImage.trim() && isValidUrl(eventMainImage) && !imageLoadError;

  const hasChanges = initialFormSnapshot != null && (
    eventName !== initialFormSnapshot.eventName ||
    country !== initialFormSnapshot.country ||
    location !== initialFormSnapshot.location ||
    mainDescription !== initialFormSnapshot.mainDescription ||
    region !== initialFormSnapshot.region ||
    startDate !== initialFormSnapshot.startDate ||
    endDate !== initialFormSnapshot.endDate ||
    eventMainImage.trim() !== initialFormSnapshot.eventMainImage ||
    (relatedCustomer?.id_customer ?? null) !== initialFormSnapshot.idCustomer
  );

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
      <div className="w-full">
        <Link
          href="/logged/pages/network/contents/events"
          className="inline-block text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back to Events
        </Link>

        {/* Título previo (X) + año Start Date; título definitivo en layout = X + año */}
        <div className="flex flex-row items-center gap-4 mb-6 pb-6 border-b border-gray-200 flex-wrap">
          <div className="flex flex-col gap-1 max-w-md">
            <label className="block text-sm font-semibold text-gray-600">Título previo</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Event name"
              className="w-full text-2xl font-bold text-gray-900 px-4 py-3 border-2 border-gray-300 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-400"
            />
          </div>
          <div className="flex flex-row items-center gap-2 shrink-0">
            <span className="text-xl font-bold text-gray-900 tabular-nums">
              {startYear || (startDate && startDate.length >= 4 ? startDate.split('-')[0] : '—')}
            </span>
          </div>
          <button
            type="button"
            onClick={handleDeleteClick}
            className="shrink-0 px-5 py-2.5 border-2 border-red-600 text-red-600 rounded-xl hover:bg-red-50 font-semibold"
          >
            Delete event
          </button>
        </div>

        {/* Main image - large, with overlay to open mediateca (select or add image); no URL input */}
        <div className="relative w-full mb-8 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
          {showImagePreview ? (
            <img
              src={eventMainImage.trim()}
              alt="Event"
              className="w-full max-h-[420px] object-contain object-center"
              onError={() => setImageLoadError(true)}
            />
          ) : null}
          <div className={`w-full min-h-[280px] flex flex-col items-center justify-center gap-2 text-gray-400 ${showImagePreview ? 'hidden' : ''}`}>
            <ImagePlaceholderSvg />
            <span>No image</span>
          </div>
          <div className="absolute bottom-3 right-3 rounded-xl shadow-lg bg-white/80 p-3 flex flex-col gap-2 min-w-[200px]">
            <span className="text-xs font-semibold text-gray-700">Main image</span>
            <button
              type="button"
              onClick={() => setMediatecaOpen(true)}
              className="px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-950 hover:bg-blue-50/50 transition-colors font-medium text-sm"
            >
              Update image
            </button>
            {eventMainImage.trim() && (
              <div className="flex items-center gap-2">
                <img
                  src={eventMainImage.trim()}
                  alt=""
                  className="w-10 h-10 object-cover rounded border border-gray-200 flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setEventMainImage('');
                    setImageLoadError(false);
                  }}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Related to (account) - below image */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
            Related to
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCustomerModalOpen(true)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-blue-950 hover:bg-blue-50/30 transition-colors font-medium text-left min-w-[200px]"
            >
              {relatedCustomer
                ? `${relatedCustomer.name || relatedCustomer.id_customer}${relatedCustomer.id_customer ? ` (${relatedCustomer.id_customer})` : ''}`
                : 'Select account…'}
            </button>
            {relatedCustomer && (
              <button
                type="button"
                onClick={() => setRelatedCustomer(null)}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                Event ID (read-only)
              </label>
              <p className="text-lg text-gray-700 bg-gray-200 px-3 py-2 rounded">{event.id_fair}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                Previous edition?
              </label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={previousEditionOn}
                    onClick={() => {
                      setPreviousEditionOn(false);
                      setPreviousEditionEvent(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !previousEditionOn
                        ? 'bg-blue-950 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={previousEditionOn}
                    onClick={() => setPreviousEditionOn(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      previousEditionOn
                        ? 'bg-blue-950 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    Yes
                  </button>
                </div>
                {previousEditionOn && (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviousEditionModalOpen(true)}
                      className="w-full max-w-xs px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-950 hover:bg-blue-50/50 transition-colors font-medium text-sm"
                    >
                      Select previous edition
                    </button>
                    {previousEditionEvent && (
                      <div className="mt-2 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Previous edition</p>
                        <p className="font-semibold text-gray-900">{previousEditionEvent.event_name}</p>
                        <p className="text-sm text-gray-600 mt-1 font-mono">{previousEditionEvent.id_fair}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {normalizeDateForInput(previousEditionEvent.start_date)} – {normalizeDateForInput(previousEditionEvent.end_date)}
                          {previousEditionEvent.region ? ` · ${previousEditionEvent.region}` : ''}
                        </p>
                        <Link
                          href={`/logged/pages/network/contents/events/${encodeURIComponent(previousEditionEvent.id_fair)}`}
                          className="inline-block mt-3 text-sm font-medium text-blue-950 hover:underline"
                        >
                          Open event →
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPreviousEditionEvent(null)}
                          className="block mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Clear selection
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="md:col-span-2" />
            <div>
              <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                Location (city)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as Region)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <div className="text-sm font-semibold text-gray-500 uppercase mb-2">Start Date</div>
              <DateInputs
                day={startDay}
                month={startMonth}
                year={startYear}
                onDayChange={(v) => handleStartDateChange(v, startMonth, startYear)}
                onMonthChange={(v) => handleStartDateChange(startDay, v, startYear)}
                onYearChange={(v) => handleStartDateChange(startDay, startMonth, v)}
              />
            </div>
            <div className="md:col-span-2">
              <div className="text-sm font-semibold text-gray-500 uppercase mb-2">End Date</div>
              <DateInputs
                day={endDay}
                month={endMonth}
                year={endYear}
                onDayChange={(v) => handleEndDateChange(v, endMonth, endYear)}
                onMonthChange={(v) => handleEndDateChange(endDay, v, endYear)}
                onYearChange={(v) => handleEndDateChange(endDay, endMonth, v)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                Duration
              </label>
              <p className="text-lg text-gray-700 px-3 py-2">
                {getDuration()} day{getDuration() !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-500">Visible in portals</label>
          <div className="flex flex-col gap-2">
            {eventPortals.length === 0 ? (
              <p className="text-sm text-gray-400">Not visible in any portal yet.</p>
            ) : (
              <ul className="list-none flex flex-wrap gap-2">
                {eventPortals.map((ep) => (
                  <li
                    key={ep.portalId}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
                  >
                    <span>{ep.portalName}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        if (portalActionLoading) return;
                        setPortalActionLoading(true);
                        try {
                          const list = await EventsService.removeEventFromPortal(event.id_fair, ep.portalId);
                          setEventPortals(Array.isArray(list) ? list : []);
                        } catch (e: any) {
                          alert(e?.message || e?.data?.message || 'Error removing from portal');
                        } finally {
                          setPortalActionLoading(false);
                        }
                      }}
                      disabled={portalActionLoading}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {allPortals.filter((p) => !eventPortals.some((ep) => ep.portalId === p.id)).length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  id="add-event-portal-select"
                  disabled={portalActionLoading}
                  className="px-3 py-2 border rounded-xl bg-white text-gray-700 text-sm disabled:opacity-50 max-w-xs"
                  defaultValue=""
                >
                  <option value="">Select portal to add…</option>
                  {allPortals
                    .filter((p) => !eventPortals.some((ep) => ep.portalId === p.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  disabled={portalActionLoading}
                  onClick={async () => {
                    const sel = document.getElementById('add-event-portal-select') as HTMLSelectElement;
                    const portalId = sel?.value ? Number(sel.value) : 0;
                    if (portalId && event) {
                      setPortalActionLoading(true);
                      try {
                        const list = await EventsService.addEventToPortal(event.id_fair, portalId);
                        setEventPortals(Array.isArray(list) ? list : []);
                        sel.value = '';
                      } catch (e: any) {
                        alert(e?.message || e?.data?.message || 'Error adding to portal');
                      } finally {
                        setPortalActionLoading(false);
                      }
                    }
                  }}
                  className="px-3 py-2 text-xs rounded-xl bg-blue-950 text-white hover:bg-blue-950/90 disabled:opacity-50"
                >
                  {portalActionLoading ? '…' : 'Add to portal'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-2xl font-bold text-gray-900 mb-4">Description</label>
          <textarea
            value={mainDescription}
            onChange={(e) => setMainDescription(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
          />
        </div>

        <div className="mb-6">
          <h2 className="block text-xl font-bold text-gray-900 mb-3">Event articles</h2>
          {eventArticles.length > 0 ? (
            <ul className="list-none divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
              {eventArticles.map((art) => (
                <li key={art.id_article}>
                  <Link
                    href={`/logged/pages/network/contents/articles/${encodeURIComponent(art.id_article)}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50 text-gray-900 no-underline"
                  >
                    <span className="font-medium">{art.articleTitle || art.id_article}</span>
                    {art.date && (
                      <span className="text-sm text-gray-500 shrink-0">
                        {normalizeDateForInput(art.date) || art.date}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm py-3">No articles linked to this event.</p>
          )}
        </div>

      </div>
            </div>
          </div>
        </div>
      </PageContentSection>

      {/* Floating Save changes - bottom right, only when there are changes */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={handleSaveClick}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg font-bold text-base"
          >
            Save changes
          </button>
        </div>
      )}

      {/* Save changes modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Save changes</h2>
            <p className="text-gray-600 mb-6">
              Do you want to save the changes? The page will reload.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleSaveCancel}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfirm}
                disabled={saving}
                className="px-4 py-2 bg-blue-950 text-white rounded-lg hover:bg-blue-900 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomerSelectModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSelectCustomer={(customer) => {
          setRelatedCustomer(customer);
          setCustomerModalOpen(false);
        }}
      />

      <MediatecaModal
        open={mediatecaOpen}
        onClose={() => setMediatecaOpen(false)}
        onSelectImage={(imageUrl) => {
          setEventMainImage(imageUrl);
          setImageLoadError(false);
          setMediatecaOpen(false);
        }}
      />

      <EventSelectModal
        open={previousEditionModalOpen}
        onClose={() => setPreviousEditionModalOpen(false)}
        excludeEventId={event.id_fair}
        onSelectEvent={(eventId) => {
          EventsService.getEventById(eventId)
            .then((ev) => {
              setPreviousEditionEvent(ev);
              setPreviousEditionModalOpen(false);
            })
            .catch(() => {});
        }}
      />

      {/* Delete event modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete event</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{event.event_name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IdEvent;
