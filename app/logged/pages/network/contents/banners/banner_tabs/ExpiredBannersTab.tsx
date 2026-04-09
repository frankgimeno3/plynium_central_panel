"use client";

import React, { FC, useMemo } from 'react';
import BannerCard from '../banner_components/BannerCard';
import type { Banner } from '../hooks/useBanners';

export interface ExpiredBannersTabProps {
    expiredBanners: Banner[];
    onEditSchedule: (bannerId: string) => void;
    onSaveSchedule: (bannerId: string, startsAt: string, endsAt: string) => void;
    onChangeImage: (bannerId: string, section: string, type?: 'top' | 'right' | 'medium') => void;
    onChangeRedirection: (bannerId: string, section: string, type?: 'top' | 'right' | 'medium') => void;
    /** Resolve section id for custom banners (by route + position type) for modals */
    resolveSectionForBanner: (banner: Banner) => string;
}

const ExpiredBannersTab: FC<ExpiredBannersTabProps> = ({
    expiredBanners,
    onEditSchedule,
    onSaveSchedule,
    onChangeImage,
    onChangeRedirection,
    resolveSectionForBanner,
}) => {
    const sorted = useMemo(
        () => [...expiredBanners].sort((a, b) => b.endsAt.localeCompare(a.endsAt)),
        [expiredBanners]
    );

    if (sorted.length === 0) {
        return (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-600">
                No expired banners for this portal.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">
                Banners past their end date are shown here with appearance weight 0 and status expired.
            </p>
            {sorted.map((banner) => {
                const section = resolveSectionForBanner(banner);
                const t: 'top' | 'right' | 'medium' = banner.positionType;
                return (
                    <div key={banner.id} className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-amber-900">Expired</span>
                            <span className="text-xs text-gray-600">
                                Ends {banner.endsAt} · Slot {banner.positionType} · {banner.pageType === 'home' ? 'Home' : banner.route}
                            </span>
                        </div>
                        <BannerCard
                            banner={banner}
                            showArrows={false}
                            onChangeImage={() => onChangeImage(banner.id, section, t)}
                            onChangeRedirection={() => onChangeRedirection(banner.id, section, t)}
                            onSaveSchedule={(s, e) => onSaveSchedule(banner.id, s, e)}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default ExpiredBannersTab;
