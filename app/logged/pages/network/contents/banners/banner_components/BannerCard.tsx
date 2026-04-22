"use client";

import React, { FC, useEffect, useMemo, useState } from 'react';
import { Banner } from '../hooks/useBanners';
import { splitYmd } from '../bannerDateUtils';

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

    const startInit = useMemo(() => splitYmd(banner.startsAt || ''), [banner.startsAt]);
    const endInit = useMemo(() => splitYmd(banner.endsAt || ''), [banner.endsAt]);
    const startLabel = useMemo(() => {
        if (startInit.dd && startInit.mm && startInit.yyyy) return `${startInit.dd}/${startInit.mm}/${startInit.yyyy}`;
        return banner.startsAt || '—';
    }, [startInit.dd, startInit.mm, startInit.yyyy, banner.startsAt]);
    const endLabel = useMemo(() => {
        if (endInit.dd && endInit.mm && endInit.yyyy) return `${endInit.dd}/${endInit.mm}/${endInit.yyyy}`;
        return banner.endsAt || '—';
    }, [endInit.dd, endInit.mm, endInit.yyyy, banner.endsAt]);

    useEffect(() => {
        setImageError(false);
    }, [banner.src]);

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
                    <p className='text-sm text-gray-500'>Schedule</p>
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className='text-xs text-gray-500 w-10'>Start</span>
                            <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700">
                                {startLabel}
                            </span>
                        </div>

                        <div className='flex flex-wrap items-center gap-2'>
                            <span className='text-xs text-gray-500 w-10'>End</span>
                            <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700">
                                {endLabel}
                            </span>
                        </div>
                    </div>
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
                      Edit Dates
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
