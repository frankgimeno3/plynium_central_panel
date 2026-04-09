"use client";

import React, { FC, useEffect, useState } from 'react';
import { addOneYearYmd, splitYmd, todayYmd, ymdFromParts } from '../bannerDateUtils';

interface BannerScheduleModalProps {
    isOpen: boolean;
    mode: 'add' | 'edit';
    /** YYYY-MM-DD */
    defaultStartIso?: string;
    /** YYYY-MM-DD */
    defaultEndIso?: string;
    onConfirm: (startsAt: string, endsAt: string) => void;
    onCancel: () => void;
}

const emptyParts = () => ({ dd: '', mm: '', yyyy: '' });

const BannerScheduleModal: FC<BannerScheduleModalProps> = ({
    isOpen,
    mode,
    defaultStartIso,
    defaultEndIso,
    onConfirm,
    onCancel,
}) => {
    const [startParts, setStartParts] = useState(emptyParts());
    const [endParts, setEndParts] = useState(emptyParts());
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        const t = todayYmd();
        const s = defaultStartIso && defaultStartIso.length >= 10 ? defaultStartIso.slice(0, 10) : t;
        const e =
            defaultEndIso && defaultEndIso.length >= 10
                ? defaultEndIso.slice(0, 10)
                : addOneYearYmd(s);
        const sp = splitYmd(s);
        const ep = splitYmd(e);
        setStartParts({ dd: sp.dd, mm: sp.mm, yyyy: sp.yyyy });
        setEndParts({ dd: ep.dd, mm: ep.mm, yyyy: ep.yyyy });
    }, [isOpen, defaultStartIso, defaultEndIso, mode]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        const startIso = ymdFromParts(startParts.dd, startParts.mm, startParts.yyyy);
        const endIso = ymdFromParts(endParts.dd, endParts.mm, endParts.yyyy);
        if (!startIso || !endIso) {
            setError('Enter valid day, month and year for both start and end.');
            return;
        }
        if (endIso < startIso) {
            setError('End date must be on or after start date.');
            return;
        }
        setError(null);
        onConfirm(startIso, endIso);
    };

    const title = mode === 'add' ? 'Banner schedule' : 'Edit banner schedule';

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
            onClick={onCancel}
            role="presentation"
        >
            <div
                className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="banner-schedule-title"
            >
                <button
                    type="button"
                    className="absolute right-4 top-4 text-2xl text-gray-500 hover:text-gray-700"
                    onClick={onCancel}
                    aria-label="Close"
                >
                    ×
                </button>
                <h2 id="banner-schedule-title" className="mb-4 text-xl font-semibold text-gray-800">
                    {title}
                </h2>
                <p className="mb-4 text-sm text-gray-600">
                    Enter dates manually (day, month, year). All fields are required.
                </p>

                <div className="mb-4">
                    <p className="mb-2 text-sm font-medium text-gray-700">Start date</p>
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="dd"
                            maxLength={2}
                            className="w-14 rounded border border-gray-300 px-2 py-1 text-sm"
                            value={startParts.dd}
                            onChange={(e) => setStartParts((p) => ({ ...p, dd: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                        />
                        <span className="text-gray-500">/</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="mm"
                            maxLength={2}
                            className="w-14 rounded border border-gray-300 px-2 py-1 text-sm"
                            value={startParts.mm}
                            onChange={(e) => setStartParts((p) => ({ ...p, mm: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                        />
                        <span className="text-gray-500">/</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="yyyy"
                            maxLength={4}
                            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                            value={startParts.yyyy}
                            onChange={(e) => setStartParts((p) => ({ ...p, yyyy: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <p className="mb-2 text-sm font-medium text-gray-700">End date</p>
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="dd"
                            maxLength={2}
                            className="w-14 rounded border border-gray-300 px-2 py-1 text-sm"
                            value={endParts.dd}
                            onChange={(e) => setEndParts((p) => ({ ...p, dd: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                        />
                        <span className="text-gray-500">/</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="mm"
                            maxLength={2}
                            className="w-14 rounded border border-gray-300 px-2 py-1 text-sm"
                            value={endParts.mm}
                            onChange={(e) => setEndParts((p) => ({ ...p, mm: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                        />
                        <span className="text-gray-500">/</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="yyyy"
                            maxLength={4}
                            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                            value={endParts.yyyy}
                            onChange={(e) => setEndParts((p) => ({ ...p, yyyy: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        />
                    </div>
                </div>

                {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        onClick={handleSubmit}
                    >
                        {mode === 'add' ? 'Add banner' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BannerScheduleModal;
