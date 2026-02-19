"use client";

import React, { FC, useState } from 'react';
import AdSectionModal from './banner_components/AdSectionModal';
import DeleteSectionModal from './banner_components/DeleteSectionModal';
import EditRouteModal from './banner_components/EditRouteModal';
import ChangeImageModal from './banner_components/ChangeImageModal';
import ChangeRedirectionModal from './banner_components/ChangeRedirectionModal';
import TopBannersTab from './banner_tabs/TopBannersTab';
import MiddleBannersTab from './banner_tabs/MiddleBannersTab';
import RightBannersTab from './banner_tabs/RightBannersTab';
import { useBanners } from './hooks/useBanners';

type BannerTab = 'top' | 'middle' | 'right';

const TAB_LABELS: Record<BannerTab, string> = {
    top: 'Top Banners',
    middle: 'Middle Banners',
    right: 'Right Banners',
};

const Banners: FC = () => {
    const [activeTab, setActiveTab] = useState<BannerTab>('top');

    const {
        homePageRightBanners,
        homePageTopBanner,
        generalMediumBanner,
        customTopSections,
        customRightSections,
        customMediumSections,
        showAdSectionModal,
        showDeleteModal,
        showEditRouteModal,
        showChangeImageModal,
        showChangeRedirectionModal,
        adSectionType,
        setShowAdSectionModal,
        setShowDeleteModal,
        setShowEditRouteModal,
        setShowChangeImageModal,
        setShowChangeRedirectionModal,
        setDeleteSectionId,
        setEditSectionId,
        setAdSectionType,
        handleMoveBannerUp,
        handleMoveBannerDown,
        handleAddHomePageTopBanner,
        handleAddGeneralMediumBanner,
        handleAddHomePageRightBanner,
        handleAddCustomRightBanner,
        handleAddCustomSection,
        handleDeleteSection,
        handleEditRoute,
        handleChangeImage,
        handleChangeRedirection,
        openDeleteModal,
        openEditRouteModal,
        openChangeImageModal,
        openChangeRedirectionModal,
        getCurrentRoute,
        getCurrentBannerSrc,
        getCurrentBannerRedirection,
    } = useBanners();

    const openTopCustomSectionModal = () => {
        setAdSectionType('top');
        setShowAdSectionModal(true);
    };
    const openMediumCustomSectionModal = () => {
        setAdSectionType('medium');
        setShowAdSectionModal(true);
    };
    const openRightCustomSectionModal = () => {
        setAdSectionType('right');
        setShowAdSectionModal(true);
    };

    return (
        <div className="flex flex-col w-full">
            <div className="text-center bg-blue-950/70 p-5 text-white">
                <p className="text-2xl">Banner management</p>
            </div>
            <div className="flex flex-col w-full gap-4 bg-white min-h-screen p-12 px-46">
                {/* Tabs */}
                <div className="flex flex-row border-b border-gray-200 gap-1">
                    {(Object.keys(TAB_LABELS) as BannerTab[]).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
                                activeTab === tab
                                    ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {TAB_LABELS[tab]}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                {activeTab === 'top' && (
                    <TopBannersTab
                        homePageTopBanner={homePageTopBanner}
                        customTopSections={customTopSections}
                        onAddHomeTopBanner={handleAddHomePageTopBanner}
                        onAddCustomSection={openTopCustomSectionModal}
                        onChangeImage={openChangeImageModal}
                        onChangeRedirection={openChangeRedirectionModal}
                        onEditRoute={openEditRouteModal}
                        onDeleteSection={openDeleteModal}
                    />
                )}
                {activeTab === 'middle' && (
                    <MiddleBannersTab
                        generalMediumBanner={generalMediumBanner}
                        customMediumSections={customMediumSections}
                        onAddGeneralMediumBanner={handleAddGeneralMediumBanner}
                        onAddCustomSection={openMediumCustomSectionModal}
                        onChangeImage={openChangeImageModal}
                        onChangeRedirection={openChangeRedirectionModal}
                        onEditRoute={openEditRouteModal}
                        onDeleteSection={openDeleteModal}
                    />
                )}
                {activeTab === 'right' && (
                    <RightBannersTab
                        homePageRightBanners={homePageRightBanners}
                        customRightSections={customRightSections}
                        onAddHomeRightBanner={handleAddHomePageRightBanner}
                        onAddCustomSection={openRightCustomSectionModal}
                        onAddBannerToSection={handleAddCustomRightBanner}
                        onMoveBannerUp={handleMoveBannerUp}
                        onMoveBannerDown={handleMoveBannerDown}
                        onChangeImage={openChangeImageModal}
                        onChangeRedirection={openChangeRedirectionModal}
                        onEditRoute={openEditRouteModal}
                        onDeleteSection={openDeleteModal}
                    />
                )}

                {/* Modals (shared) */}
                <AdSectionModal
                    isOpen={showAdSectionModal}
                    sectionType={adSectionType}
                    onConfirm={handleAddCustomSection}
                    onCancel={() => setShowAdSectionModal(false)}
                />
                <DeleteSectionModal
                    isOpen={showDeleteModal}
                    onConfirm={handleDeleteSection}
                    onCancel={() => {
                        setShowDeleteModal(false);
                        setDeleteSectionId(null);
                    }}
                />
                <EditRouteModal
                    isOpen={showEditRouteModal}
                    currentRoute={getCurrentRoute()}
                    onConfirm={handleEditRoute}
                    onCancel={() => {
                        setShowEditRouteModal(false);
                        setEditSectionId(null);
                    }}
                />
                <ChangeImageModal
                    isOpen={showChangeImageModal}
                    currentSrc={getCurrentBannerSrc()}
                    onConfirm={handleChangeImage}
                    onCancel={() => setShowChangeImageModal(false)}
                />
                <ChangeRedirectionModal
                    isOpen={showChangeRedirectionModal}
                    currentRedirection={getCurrentBannerRedirection()}
                    onConfirm={handleChangeRedirection}
                    onCancel={() => setShowChangeRedirectionModal(false)}
                />
            </div>
        </div>
    );
};

export default Banners;
