'use client';

import React, { FC, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DatePicker from '@/app/logged/logged_components/DatePicker';
import { EventsService } from '@/app/service/EventsService';

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
}

function normalizeDateForInput(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
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
  const [eventMainImage, setEventMainImage] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await EventsService.getEventById(eventId);
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

  if (!eventId) {
    return (
      <div className="flex flex-col w-full h-full min-h-screen text-gray-600 px-6 py-10 gap-6 items-center justify-center">
        <p className="text-red-500 text-lg">Invalid event</p>
        <button
          onClick={() => router.push('/logged/pages/events')}
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
          onClick={() => router.push('/logged/pages/events')}
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
          onClick={() => router.push('/logged/pages/events')}
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
    if (eventMainImage.trim() && !isValidUrl(eventMainImage)) {
      alert('Please enter a valid URL for the main image.');
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
      });
      setShowSaveModal(false);
      setImageLoadError(false);
      router.refresh();
    } catch (err) {
      console.error('Error saving event:', err);
      const msg =
        typeof err === 'string'
          ? err
          : (err as { message?: string })?.message ||
            (err as { data?: { message?: string } })?.data?.message ||
            'Error saving event';
      alert(`Error al guardar: ${msg}`);
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
      router.push('/logged/pages/events');
      router.refresh();
    } catch (err) {
      console.error('Error deleting event:', err);
      const msg =
        typeof err === 'string'
          ? err
          : (err as { message?: string })?.message ||
            (err as { data?: { message?: string } })?.data?.message ||
            'Error deleting event';
      alert(`Error al eliminar: ${msg}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const showImagePreview = eventMainImage.trim() && isValidUrl(eventMainImage) && !imageLoadError;
  const urlInvalid = eventMainImage.trim() !== '' && !isValidUrl(eventMainImage);

  return (
    <div className="flex flex-col w-full min-h-screen bg-white px-6 py-10">
      <div className="flex flex-row items-center justify-between gap-4 mb-6 flex-wrap">
        <button
          onClick={() => router.push('/logged/pages/events')}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          ← Back to Events
        </button>
      </div>

      <div className="w-full">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Edit Event</h1>

        {/* Main image - value from DB, updates on Save changes */}
        <div className="w-full mb-6">
          <label className="block text-sm font-semibold text-gray-500 uppercase mb-2">
            Main image (URL)
          </label>
          <input
            type="url"
            value={eventMainImage}
            onChange={(e) => {
              setEventMainImage(e.target.value);
              setImageLoadError(false);
            }}
            placeholder="https://..."
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              urlInvalid ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {urlInvalid && (
            <p className="mt-1 text-sm text-red-500">Please enter a valid URL (e.g. https://example.com/image.jpg)</p>
          )}
          <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center shrink-0" style={{ width: '150px', height: '150px' }}>
            {showImagePreview ? (
              <img
                src={eventMainImage.trim()}
                alt="Event"
                className="w-full h-full object-contain object-center"
                onError={() => setImageLoadError(true)}
              />
            ) : (
              <ImagePlaceholderSvg />
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
            <div className="md:col-span-2" />
            <div>
              <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                Event Name
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                Location
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
            <div>
              <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                Start Date
              </label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Select start date"
                max={endDate || undefined}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                End Date
              </label>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="Select end date"
                min={startDate || undefined}
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
          <label className="block text-2xl font-bold text-gray-900 mb-4">Description</label>
          <textarea
            value={mainDescription}
            onChange={(e) => setMainDescription(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            onClick={handleDeleteClick}
            className="px-6 py-2 border border-red-600 text-red-600 rounded-xl hover:bg-red-50"
          >
            Delete event
          </button>
          <button
            onClick={handleSaveClick}
            className="px-6 py-2 bg-blue-950 text-white rounded-xl hover:bg-blue-900"
          >
            Save changes
          </button>
        </div>
      </div>

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
    </div>
  );
};

export default IdEvent;
