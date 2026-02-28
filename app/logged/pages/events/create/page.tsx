'use client';

import React, { FC, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from '@/app/logged/logged_components/DatePicker';
import { EventsService } from '@/app/service/EventsService';
import { PortalService } from '@/app/service/PortalService';

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

interface EventForm {
  event_name: string;
  country: string;
  main_description: string;
  region: Region;
  start_date: string;
  end_date: string;
  location: string;
  event_main_image: string;
}

const initialForm: EventForm = {
  event_name: '',
  country: '',
  main_description: '',
  region: 'EUROPE',
  start_date: '',
  end_date: '',
  location: '',
  event_main_image: '',
};

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
      className="w-full h-full text-gray-300"
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

function generateEventId(events: { id_fair: string }[]): string {
  const currentYear = new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2);
  const pattern = new RegExp(`^fair-${yearSuffix}-(\\d{4})$`);
  const currentYearEvents = events.filter((e) => pattern.test(e.id_fair));
  let maxOrdinal = 0;
  currentYearEvents.forEach((e) => {
    const match = e.id_fair.match(new RegExp(`^fair-\\d{2}-(\\d{4})$`));
    if (match) {
      const ordinal = parseInt(match[1], 10);
      if (ordinal > maxOrdinal) maxOrdinal = ordinal;
    }
  });
  const nextOrdinal = maxOrdinal + 1;
  const ordinalString = nextOrdinal.toString().padStart(4, '0');
  return `fair-${yearSuffix}-${ordinalString}`;
}

const CreateEvent: FC = () => {
  const router = useRouter();
  const [idFair, setIdFair] = useState('');
  const [isGeneratingId, setIsGeneratingId] = useState(true);
  const [form, setForm] = useState<EventForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof EventForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [portals, setPortals] = useState<{ id: number; name: string }[]>([]);
  const [selectedPortalIds, setSelectedPortalIds] = useState<number[]>([]);

  useEffect(() => {
    PortalService.getAllPortals()
      .then((list: any[]) => {
        setPortals(
          Array.isArray(list)
            ? list.map((p) => ({ id: p.id, name: p.name ?? String(p.key ?? p.id) }))
            : []
        );
      })
      .catch(() => setPortals([]));
  }, []);

  const handleTogglePortal = (portalId: number) => {
    setSelectedPortalIds((prev) =>
      prev.includes(portalId)
        ? prev.filter((id) => id !== portalId)
        : [...prev, portalId]
    );
  };

  const loadEventId = useCallback(async () => {
    setIsGeneratingId(true);
    try {
      const allEvents = await EventsService.getAllEvents();
      const generatedId = generateEventId(allEvents);
      setIdFair(generatedId);
    } catch (err) {
      console.error('Error generating event ID:', err);
      const yearSuffix = new Date().getFullYear().toString().slice(-2);
      setIdFair(`fair-${yearSuffix}-0001`);
    } finally {
      setIsGeneratingId(false);
    }
  }, []);

  useEffect(() => {
    loadEventId();
  }, [loadEventId]);

  const update = (field: keyof EventForm, value: string | Region) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const [portalError, setPortalError] = useState<string | null>(null);

  const validate = (): boolean => {
    setPortalError(null);
    const next: Partial<Record<keyof EventForm, string>> = {};
    if (!form.event_name.trim()) next.event_name = 'Event name is required';
    if (!form.country.trim()) next.country = 'Country is required';
    if (!form.location.trim()) next.location = 'Location is required';
    if (!form.start_date) next.start_date = 'Start date is required';
    if (!form.end_date) next.end_date = 'End date is required';
    if (selectedPortalIds.length === 0 && portals.length > 0) {
      setPortalError('Select at least one portal');
    } else {
      setPortalError(null);
    }
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      next.end_date = 'End date must be on or after start date';
    }
    if (form.event_main_image.trim() && !isValidUrl(form.event_main_image)) {
      next.event_main_image = 'Please enter a valid URL (e.g. https://example.com/logo.png)';
    }
    const portalInvalid = selectedPortalIds.length === 0 && portals.length > 0;
    setErrors(next);
    return Object.keys(next).length === 0 && !portalInvalid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !idFair || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await EventsService.createEvent({
        id_fair: idFair,
        event_name: form.event_name.trim(),
        country: form.country.trim(),
        main_description: form.main_description.trim(),
        region: form.region,
        start_date: form.start_date,
        end_date: form.end_date,
        location: form.location.trim(),
        event_main_image: form.event_main_image.trim(),
        portalIds: selectedPortalIds.length > 0 ? selectedPortalIds : [],
      });
      router.push('/logged/pages/events');
      router.refresh();
    } catch (error: unknown) {
      console.error('Error creating event:', error);
      const msg =
        typeof error === 'string'
          ? error
          : (error as { message?: string })?.message ||
            (error as { data?: { message?: string } })?.data?.message ||
            'Error creating event';
      alert(`Error al crear el evento: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDuration = () => {
    if (!form.start_date || !form.end_date) return 0;
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffTime = end.getTime() - start.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-white px-6 py-10">
      <button
        onClick={() => router.push('/logged/pages/events')}
        className="mb-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm self-start"
      >
        ← Back to Events
      </button>

      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Create event</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Main image: optional URL, saved to event_main_image on create */}
          <div className="w-full">
            <label className="block text-sm font-semibold text-gray-500 uppercase mb-2">
              Main image (URL)
            </label>
            <input
              type="url"
              value={form.event_main_image}
              onChange={(e) => {
                update('event_main_image', e.target.value);
                setImageLoadError(false);
              }}
              placeholder="https://..."
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.event_main_image ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.event_main_image && (
              <p className="mt-1 text-sm text-red-500">{errors.event_main_image}</p>
            )}
            <div className="mt-3 w-32 h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center shrink-0">
              {form.event_main_image.trim() && isValidUrl(form.event_main_image) && !imageLoadError ? (
                <img
                  src={form.event_main_image.trim()}
                  alt=""
                  className="w-full h-full object-contain object-center"
                  onError={() => setImageLoadError(true)}
                />
              ) : (
                <ImagePlaceholderSvg />
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Event ID
                </label>
                <p className="text-lg text-gray-700 bg-gray-200 px-3 py-2 rounded">
                  {isGeneratingId ? 'Generating...' : idFair}
                </p>
              </div>
              <div className="md:col-span-2" />
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Event Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.event_name}
                  onChange={(e) => update('event_name', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.event_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.event_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.event_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  placeholder="e.g. Paris, France"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-500">{errors.location}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => update('country', e.target.value)}
                  placeholder="e.g. France"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.country ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.country && (
                  <p className="mt-1 text-sm text-red-500">{errors.country}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Region
                </label>
                <select
                  value={form.region}
                  onChange={(e) => update('region', e.target.value as Region)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={form.start_date}
                  onChange={(v) => update('start_date', v)}
                  placeholder="Select start date"
                  max={form.end_date || undefined}
                />
                {errors.start_date && (
                  <p className="mt-1 text-sm text-red-500">{errors.start_date}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={form.end_date}
                  onChange={(v) => update('end_date', v)}
                  placeholder="Select end date"
                  min={form.start_date || undefined}
                />
                {errors.end_date && (
                  <p className="mt-1 text-sm text-red-500">{errors.end_date}</p>
                )}
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

          <div>
            <label className="block text-sm font-semibold text-gray-500 uppercase mb-2">
              Portals * (select at least one)
            </label>
            <p className="text-sm text-gray-600 mb-2">
              Choose in which portal(s) this event will be visible.
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
                      onChange={() => handleTogglePortal(p.id)}
                      className="rounded border-gray-300"
                    />
                    <span>{p.name}</span>
                  </label>
                ))
              )}
            </div>
            {(selectedPortalIds.length === 0 && portals.length > 0) && (
              <p className="text-sm text-amber-600 mt-1">
                {portalError || 'Select at least one portal to continue.'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-2xl font-bold text-gray-900 mb-4">
              Description
            </label>
            <textarea
              value={form.main_description}
              onChange={(e) => update('main_description', e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
              placeholder="Event description..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/logged/pages/events')}
              className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isGeneratingId}
              className="px-6 py-2 bg-blue-950 text-white rounded-xl hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
