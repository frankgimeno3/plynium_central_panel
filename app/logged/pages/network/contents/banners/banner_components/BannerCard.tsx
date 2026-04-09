"use client";

import React, { FC, useEffect, useMemo, useState } from 'react';
import { Banner } from '../hooks/useBanners';
import { splitYmd, ymdFromParts } from '../bannerDateUtils';

interface BannerCardProps {
    banner: Banner;
    showArrows?: boolean;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
    onChangeImage?: () => void;
    onChangeRedirection?: () => void;
    onEditSchedule?: () => void;
    onSaveSchedule?: (startsAt: string, endsAt: string) => void;
}

const BannerCard: FC<BannerCardProps> = ({
    banner,
    showArrows = true,
    onMoveUp,
    onMoveDown,
    canMoveUp = false,
    canMoveDown = false,
    onChangeImage,
    onChangeRedirection,
    onEditSchedule,
    onSaveSchedule,
}) => {
    const displayAlt = banner.imageAlt && banner.imageAlt.trim() !== '' ? banner.imageAlt.trim() : banner.id;
    const [imageError, setImageError] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(false);
    const [scheduleError, setScheduleError] = useState<string | null>(null);

    const startInit = useMemo(() => splitYmd(banner.startsAt || ''), [banner.startsAt]);
    const endInit = useMemo(() => splitYmd(banner.endsAt || ''), [banner.endsAt]);
    const [startParts, setStartParts] = useState(startInit);
    const [endParts, setEndParts] = useState(endInit);

    useEffect(() => {
        setImageError(false);
    }, [banner.src]);

    useEffect(() => {
        setStartParts(splitYmd(banner.startsAt || ''));
        setEndParts(splitYmd(banner.endsAt || ''));
        setScheduleError(null);
        setEditingSchedule(false);
    }, [banner.startsAt, banner.endsAt, banner.id]);

    const saveSchedule = () => {
        const startIso = ymdFromParts(startParts.dd, startParts.mm, startParts.yyyy);
        const endIso = ymdFromParts(endParts.dd, endParts.mm, endParts.yyyy);
        if (!startIso || !endIso) {
            setScheduleError('Enter valid dd/mm/yyyy for both start and end.');
            return;
        }
        if (endIso < startIso) {
            setScheduleError('End date must be on or after start date.');
            return;
        }
        setScheduleError(null);
        onSaveSchedule?.(startIso, endIso);
        setEditingSchedule(false);
    };

    return (
        <div className='flex flex-row items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50'>
            <div className='flex flex-row items-center gap-5'>
                <p className='text-sm text-gray-500'>Current Image:</p>
                <div className='flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%,#f3f4f6),linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%,#f3f4f6)] bg-[length:12px_12px] bg-[position:0_0,6px_6px]'>
                    {imageError ? (
                        <span className='px-1 text-center text-[10px] leading-tight text-gray-500'>PNG</span>
                    ) : (
                        <img
                            src={banner.src}
                            alt={displayAlt}
                            className='h-full w-full object-contain'
                            onError={() => setImageError(true)}
                        />
                    )}
                </div>
                <p className='text-sm text-gray-500'>ID: {banner.id}</p>
                <p className='text-sm text-gray-500'>Alt: {displayAlt}</p>
                <p className='text-sm text-gray-500'>Route: {banner.route}</p>
                <div className='flex flex-col gap-1'>
                    <p className='text-sm text-gray-500'>Schedule:</p>
                    <div className='flex flex-wrap items-center gap-2'>
                        <span className='text-xs text-gray-500'>Start</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="dd"
                            maxLength={2}
                            disabled={!editingSchedule}
                            className={`w-12 rounded border px-2 py-1 text-xs ${editingSchedule ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                            value={startParts.dd}
                            onChange={(e) => setStartParts((p) => ({ ...p, dd: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                        />
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="mm"
                            maxLength={2}
                            disabled={!editingSchedule}
                            className={`w-12 rounded border px-2 py-1 text-xs ${editingSchedule ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                            value={startParts.mm}
                            onChange={(e) => setStartParts((p) => ({ ...p, mm: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                        />
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="yyyy"
                            maxLength={4}
                            disabled={!editingSchedule}
                            className={`w-16 rounded border px-2 py-1 text-xs ${editingSchedule ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                            value={startParts.yyyy}
                            onChange={(e) => setStartParts((p) => ({ ...p, yyyy: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        />
                        <span className='text-xs text-gray-400'>→</span>
                        <span className='text-xs text-gray-500'>End</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="dd"
                            maxLength={2}
                            disabled={!editingSchedule}
                            className={`w-12 rounded border px-2 py-1 text-xs ${editingSchedule ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                            value={endParts.dd}
                            onChange={(e) => setEndParts((p) => ({ ...p, dd: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                        />
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="mm"
                            maxLength={2}
                            disabled={!editingSchedule}
                            className={`w-12 rounded border px-2 py-1 text-xs ${editingSchedule ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                            value={endParts.mm}
                            onChange={(e) => setEndParts((p) => ({ ...p, mm: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                        />
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="yyyy"
                            maxLength={4}
                            disabled={!editingSchedule}
                            className={`w-16 rounded border px-2 py-1 text-xs ${editingSchedule ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                            value={endParts.yyyy}
                            onChange={(e) => setEndParts((p) => ({ ...p, yyyy: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        />
                        {editingSchedule ? (
                            <button
                                type="button"
                                className="ml-1 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                                onClick={saveSchedule}
                            >
                                Save
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="ml-1 rounded bg-slate-600 px-2 py-1 text-xs text-white hover:bg-slate-700"
                                onClick={() => {
                                    setEditingSchedule(true);
                                    setScheduleError(null);
                                }}
                            >
                                Edit
                            </button>
                        )}
                    </div>
                    {scheduleError ? <p className="text-xs text-red-600">{scheduleError}</p> : null}
                </div>
                <p className='text-sm text-gray-500'>BannerRedirection: {banner.bannerRedirection ?? 'https://www.vidrioperfil.com'}</p>
                <button 
                    className='px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                    onClick={onChangeImage}
                >
                    Change Image
                </button>
                <button 
                    className='px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                    onClick={onChangeRedirection}
                >
                    Change Redirection
                </button>
                {onEditSchedule ? (
                  <button
                      type="button"
                      className='px-4 py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-700 cursor-pointer'
                      onClick={onEditSchedule}
                  >
                      Advanced schedule…
                  </button>
                ) : null}
            </div>
            {showArrows && onMoveUp && onMoveDown && (
                <div className='flex flex-row px-3 gap-2 items-center'>
                    <button
                        onClick={onMoveUp}
                        disabled={!canMoveUp}
                        className={`px-3 py-1 rounded ${
                            !canMoveUp
                                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                : 'bg-blue-500 hover:bg-blue-600 cursor-pointer text-white'
                        }`}
                        title="Move up"
                    >
                        ↑
                    </button>
                    <button
                        onClick={onMoveDown}
                        disabled={!canMoveDown}
                        className={`px-3 py-1 rounded ${
                            !canMoveDown
                                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                : 'bg-blue-500 hover:bg-blue-600 cursor-pointer text-white'
                        }`}
                        title="Move down"
                    >
                        ↓
                    </button>
                </div>
            )}
        </div>
    );
};

export default BannerCard;
