"use client";

import React, { FC } from 'react';
import BannerCard from '../banner_components/BannerCard';
import type { Banner, CustomSection } from '../hooks/useBanners';

export interface TopBannersTabProps {
    homePageTopBanner: Banner | null;
    customTopSections: CustomSection[];
    onAddHomeTopBanner: () => void;
    onAddCustomSection: () => void;
    onChangeImage: (bannerId: string, section: string, type?: 'top') => void;
    onChangeRedirection: (bannerId: string, section: string, type?: 'top') => void;
    onEditRoute: (sectionId: string, type: 'top') => void;
    onDeleteSection: (sectionId: string, type: 'top') => void;
}

const TopBannersTab: FC<TopBannersTabProps> = ({
    homePageTopBanner,
    customTopSections,
    onAddHomeTopBanner,
    onAddCustomSection,
    onChangeImage,
    onChangeRedirection,
    onEditRoute,
    onDeleteSection,
}) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col justify-between p-4 border border-gray-200 rounded-lg mb-2">
                <div className="flex flex-row justify-between items-center mb-4">
                    <p className="text-lg font-bold">Home Page Top Banner</p>
                </div>
                {homePageTopBanner ? (
                    <BannerCard
                        banner={homePageTopBanner}
                        showArrows={false}
                        onChangeImage={() => onChangeImage(homePageTopBanner.id, 'home-top')}
                        onChangeRedirection={() => onChangeRedirection(homePageTopBanner.id, 'home-top')}
                    />
                ) : (
                    <div className="flex flex-row items-center gap-5 p-4 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-500">No banner configured</p>
                        <button
                            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                            onClick={onAddHomeTopBanner}
                        >
                            Add Banner
                        </button>
                    </div>
                )}
            </div>
            <div className="flex flex-col justify-between p-4 border border-gray-200 rounded-lg mb-2">
                <div className="flex flex-row justify-between p-4 border-b border-gray-100">
                    <p className="text-lg font-bold">Custom page top banners</p>
                    <button
                        className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                        onClick={onAddCustomSection}
                    >
                        Add Custom Banner Section
                    </button>
                </div>
                {customTopSections.map((section) => (
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
                                    onClick={() => onEditRoute(section.id, 'top')}
                                >
                                    Edit Route
                                </button>
                                <button
                                    className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                                    onClick={() => onDeleteSection(section.id, 'top')}
                                >
                                    Delete Section
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            {section.banners
                                .sort((a, b) => a.position - b.position)
                                .map((banner) => (
                                    <BannerCard
                                        key={banner.id}
                                        banner={banner}
                                        showArrows={false}
                                        onChangeImage={() => onChangeImage(banner.id, section.id, 'top')}
                                    />
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TopBannersTab;
