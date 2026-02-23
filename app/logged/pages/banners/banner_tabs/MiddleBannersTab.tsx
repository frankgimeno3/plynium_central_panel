"use client";

import React, { FC, useMemo } from 'react';
import BannerCard from '../banner_components/BannerCard';
import type { Banner, CustomSection, AppearanceWeight } from '../hooks/useBanners';

const WEIGHT_VALUE: Record<AppearanceWeight, number> = { low: 2, medium: 3, high: 4 };

function getProbabilityPercent(banners: Banner[], bannerId: string): number {
    if (banners.length === 0) return 0;
    if (banners.length === 1) return 100;
    const total = banners.reduce((sum, b) => sum + WEIGHT_VALUE[b.appearanceWeight ?? 'medium'], 0);
    const banner = banners.find(b => b.id === bannerId);
    if (!banner || total === 0) return 0;
    const value = WEIGHT_VALUE[banner.appearanceWeight ?? 'medium'];
    return Math.round((value / total) * 100);
}

export interface MiddleBannersTabProps {
    generalMediumBanners: Banner[];
    customMediumSections: CustomSection[];
    onAddGeneralMediumBanner: () => void;
    onAddCustomSection: () => void;
    onAddBannerToSection: (sectionId: string) => void;
    onChangeImage: (bannerId: string, section: string, type?: 'medium') => void;
    onChangeRedirection: (bannerId: string, section: string, type?: 'medium') => void;
    onChangeAppearanceWeight: (bannerId: string, section: 'home-medium' | string, weight: AppearanceWeight) => void;
    onDeleteMediumBanner: (bannerId: string, section: 'home-medium' | string) => void;
    onEditRoute: (sectionId: string, type: 'medium') => void;
    onDeleteSection: (sectionId: string, type: 'medium') => void;
}

const MiddleBannersTab: FC<MiddleBannersTabProps> = ({
    generalMediumBanners,
    customMediumSections,
    onAddGeneralMediumBanner,
    onAddCustomSection,
    onAddBannerToSection,
    onChangeImage,
    onChangeRedirection,
    onChangeAppearanceWeight,
    onDeleteMediumBanner,
    onEditRoute,
    onDeleteSection,
}) => {
    const sortedGeneralMedium = useMemo(
        () => [...generalMediumBanners].sort((a, b) => a.position - b.position),
        [generalMediumBanners]
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col justify-between p-4 border border-gray-200 rounded-lg mb-2">
                <div className="flex flex-row justify-between items-center mb-4">
                    <p className="text-lg font-bold">General Medium Banners</p>
                    <button
                        className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                        onClick={onAddGeneralMediumBanner}
                    >
                        Add Banner
                    </button>
                </div>
                {sortedGeneralMedium.length === 0 ? (
                    <div className="flex flex-row items-center gap-5 p-4 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-500">No banner configured</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {sortedGeneralMedium.map((banner) => (
                            <div key={banner.id} className="flex flex-col gap-2 p-4 border border-gray-200 rounded-lg">
                                <div className="flex flex-row items-center justify-between gap-4 flex-wrap">
                                    <BannerCard
                                        banner={banner}
                                        showArrows={false}
                                        onChangeImage={() => onChangeImage(banner.id, 'home-medium')}
                                        onChangeRedirection={() => onChangeRedirection(banner.id, 'home-medium')}
                                    />
                                    <div className="flex flex-row items-center gap-2 flex-shrink-0">
                                        <label className="text-sm text-gray-600">Probability weight:</label>
                                        <select
                                            value={banner.appearanceWeight ?? 'medium'}
                                            onChange={(e) => onChangeAppearanceWeight(banner.id, 'home-medium', e.target.value as AppearanceWeight)}
                                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                        <span className="text-sm text-gray-500 min-w-[4rem]">
                                            {getProbabilityPercent(generalMediumBanners, banner.id)}%
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => onDeleteMediumBanner(banner.id, 'home-medium')}
                                            className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex flex-col justify-between p-4 border border-gray-200 rounded-lg mb-2">
                <div className="flex flex-row justify-between p-4 border-b border-gray-100">
                    <p className="text-lg font-bold">Custom page medium banners</p>
                    <button
                        className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                        onClick={onAddCustomSection}
                    >
                        Add Custom Banner Section
                    </button>
                </div>
                {customMediumSections.map((section) => {
                    const sectionBanners = [...section.banners].sort((a, b) => a.position - b.position);
                    return (
                        <div key={section.id} className="flex flex-col p-4 border-b border-gray-100">
                            <div className="flex flex-row justify-between mb-4">
                                <div className="flex flex-row gap-4">
                                    <div className="flex flex-row gap-2">
                                        <p>Section name:</p>
                                        <p>{section.name}</p>
                                    </div>
                                    <div className="flex flex-row gap-2">
                                        <p>Section route:</p>
                                        <p>{section.route}</p>
                                    </div>
                                </div>
                                <div className="flex flex-row gap-2">
                                    <button
                                        className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                                        onClick={() => onAddBannerToSection(section.id)}
                                    >
                                        Add Banner
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                                        onClick={() => onEditRoute(section.id, 'medium')}
                                    >
                                        Edit Route
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 cursor-pointer"
                                        onClick={() => onDeleteSection(section.id, 'medium')}
                                    >
                                        Delete Section
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-4">
                                {sectionBanners.length === 0 ? (
                                    <p className="text-sm text-gray-500">No banners in this section</p>
                                ) : (
                                    sectionBanners.map((banner) => (
                                        <div key={banner.id} className="flex flex-col gap-2 p-4 border border-gray-200 rounded-lg">
                                            <div className="flex flex-row items-center justify-between gap-4 flex-wrap">
                                                <BannerCard
                                                    banner={banner}
                                                    showArrows={false}
                                                    onChangeImage={() => onChangeImage(banner.id, section.id, 'medium')}
                                                    onChangeRedirection={() => onChangeRedirection(banner.id, section.id, 'medium')}
                                                />
                                                <div className="flex flex-row items-center gap-2 flex-shrink-0">
                                                    <label className="text-sm text-gray-600">Probability weight:</label>
                                                    <select
                                                        value={banner.appearanceWeight ?? 'medium'}
                                                        onChange={(e) => onChangeAppearanceWeight(banner.id, section.id, e.target.value as AppearanceWeight)}
                                                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                                                    >
                                                        <option value="low">Low</option>
                                                        <option value="medium">Medium</option>
                                                        <option value="high">High</option>
                                                    </select>
                                                    <span className="text-sm text-gray-500 min-w-[4rem]">
                                                        {getProbabilityPercent(section.banners, banner.id)}%
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => onDeleteMediumBanner(banner.id, section.id)}
                                                        className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MiddleBannersTab;
