"use client";

import React, { FC } from 'react';
import BannerCard from '../banner_components/BannerCard';
import type { Banner, CustomSection } from '../hooks/useBanners';

export interface RightBannersTabProps {
    homePageRightBanners: Banner[];
    customRightSections: CustomSection[];
    onAddHomeRightBanner: () => void;
    onAddCustomSection: () => void;
    onAddBannerToSection: (sectionId: string) => void;
    onMoveBannerUp: (bannerId: string, section: string, sectionType?: 'right') => void;
    onMoveBannerDown: (bannerId: string, section: string, sectionType?: 'right') => void;
    onChangeImage: (bannerId: string, section: string, type?: 'right') => void;
    onChangeRedirection: (bannerId: string, section: string, type?: 'right') => void;
    onEditRoute: (sectionId: string, type: 'right') => void;
    onDeleteSection: (sectionId: string, type: 'right') => void;
}

const RightBannersTab: FC<RightBannersTabProps> = ({
    homePageRightBanners,
    customRightSections,
    onAddHomeRightBanner,
    onAddCustomSection,
    onAddBannerToSection,
    onMoveBannerUp,
    onMoveBannerDown,
    onChangeImage,
    onChangeRedirection,
    onEditRoute,
    onDeleteSection,
}) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col justify-between p-4 border border-gray-200 rounded-lg mb-2">
                <div className="flex flex-row justify-between items-center mb-4">
                    <p className="text-lg font-bold">Home Page Right Banners</p>
                    <button
                        className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                        onClick={onAddHomeRightBanner}
                    >
                        Add Banner
                    </button>
                </div>
                <div className="flex flex-col gap-4">
                    {homePageRightBanners
                        .sort((a, b) => a.position - b.position)
                        .map((banner, index, sortedArray) => {
                            const isFirst = index === 0;
                            const isLast = index === sortedArray.length - 1;
                            return (
                                <BannerCard
                                    key={banner.id}
                                    banner={banner}
                                    showArrows={true}
                                    onMoveUp={() => onMoveBannerUp(banner.id, 'home')}
                                    onMoveDown={() => onMoveBannerDown(banner.id, 'home')}
                                    canMoveUp={!isFirst}
                                    canMoveDown={!isLast}
                                    onChangeImage={() => onChangeImage(banner.id, 'home')}
                                    onChangeRedirection={() => onChangeRedirection(banner.id, 'home')}
                                />
                            );
                        })}
                </div>
            </div>
            <div className="flex flex-col justify-between p-4 border border-gray-200 rounded-lg mb-2">
                <div className="flex flex-row justify-between p-4 border-b border-gray-100">
                    <p className="text-lg font-bold">Custom page right banners</p>
                    <button
                        className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                        onClick={onAddCustomSection}
                    >
                        Add Custom Banner Section
                    </button>
                </div>
                {customRightSections.map((section) => (
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
                                    onClick={() => onEditRoute(section.id, 'right')}
                                >
                                    Edit Route
                                </button>
                                <button
                                    className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                                    onClick={() => onDeleteSection(section.id, 'right')}
                                >
                                    Delete Section
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            {section.banners
                                .sort((a, b) => a.position - b.position)
                                .map((banner, index, sortedArray) => {
                                    const isFirst = index === 0;
                                    const isLast = index === sortedArray.length - 1;
                                    return (
                                        <BannerCard
                                            key={banner.id}
                                            banner={banner}
                                            showArrows={true}
                                            onMoveUp={() => onMoveBannerUp(banner.id, section.id, 'right')}
                                            onMoveDown={() => onMoveBannerDown(banner.id, section.id, 'right')}
                                            canMoveUp={!isFirst}
                                            canMoveDown={!isLast}
                                            onChangeImage={() => onChangeImage(banner.id, section.id, 'right')}
                                        />
                                    );
                                })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RightBannersTab;
