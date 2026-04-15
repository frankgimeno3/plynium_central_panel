"use client";

import React, { FC, useState, useEffect } from 'react';
import { usePageContent } from '@/app/logged/logged_components/context_content/PageContentContext';
import PageContentSection from '@/app/logged/logged_components/context_content/PageContentSection';
import AdSectionModal from './banner_components/AdSectionModal';
import DeleteSectionModal from './banner_components/DeleteSectionModal';
import EditRouteModal from './banner_components/EditRouteModal';
import ChangeImageModal from './banner_components/ChangeImageModal';
import ChangeRedirectionModal from './banner_components/ChangeRedirectionModal';
import TopBannersTab from './banner_tabs/TopBannersTab';
import MiddleBannersTab from './banner_tabs/MiddleBannersTab';
import RightBannersTab from './banner_tabs/RightBannersTab';
import ExpiredBannersTab from './banner_tabs/ExpiredBannersTab';
import BannerScheduleModal from './banner_components/BannerScheduleModal';
import { useBanners } from './hooks/useBanners';
import { PortalService } from '@/app/service/PortalService';

type BannerTab = 'top' | 'middle' | 'right' | 'expired';

const TAB_LABELS: Record<BannerTab, string> = {
    top: 'Top Banners',
    middle: 'Middle Banners',
    right: 'Right Banners',
    expired: 'Expired',
};

export interface PortalItem {
    id: number;
    key: string;
    name: string;
    domain: string;
}

const Banners: FC = () => {
    const [portals, setPortals] = useState<PortalItem[]>([]);
    const [portalsLoading, setPortalsLoading] = useState(true);
    const [selectedPortalId, setSelectedPortalId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<BannerTab>('top');
    const [expiredPortalTabId, setExpiredPortalTabId] = useState<number | null>(null);

    useEffect(() => {
        PortalService.getAllPortals()
            .then((data: unknown) => {
                setPortals(Array.isArray(data) ? data as PortalItem[] : []);
            })
            .catch(() => setPortals([]))
            .finally(() => setPortalsLoading(false));
    }, []);

    // Keep the expired-portal tab in sync with the selected portal.
    useEffect(() => {
        if (selectedPortalId != null) {
            setExpiredPortalTabId(selectedPortalId);
        }
    }, [selectedPortalId]);

    const {
        homePageRightBanners,
        homePageTopBanners,
        generalMediumBanners,
        customTopSections,
        customRightSections,
        customMediumSections,
        expiredBanners,
        bannerScheduleModalOpen,
        bannerScheduleModalMode,
        bannerScheduleDefaults,
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
        handleAddHomePageTopBanner,
        handleAddCustomTopBanner,
        handleChangeAppearanceWeight,
        handleDeleteTopBanner,
        handleDeleteMediumBanner,
        handleDeleteRightBanner,
        handleAddGeneralMediumBanner,
        handleAddCustomMediumBanner,
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
        handleBannerScheduleConfirm,
        handleBannerScheduleCancel,
        openEditScheduleForBanner,
        saveBannerScheduleInline,
        resolveSectionForBanner,
    } = useBanners(selectedPortalId);

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

    const selectedPortal = portals.find((p) => p.id === selectedPortalId);

    const breadcrumbs = [
        { label: "Banners" },
    ];

    const { setPageMeta } = usePageContent();
    useEffect(() => {
        setPageMeta({ pageTitle: "Banner management", breadcrumbs, buttons: [] });
    }, [setPageMeta, breadcrumbs]);

    return (
        <>
            <PageContentSection>
            <div className="flex flex-col w-full">
                <div className="bg-white rounded-b-lg overflow-hidden">
                    <div className="p-6">
                {selectedPortalId == null ? (
                    <>
                        <div className="flex items-center justify-between my-12">
                            <p className="text-lg text-gray-700">Select a portal to manage its banners</p>
                        </div>
                        {portalsLoading ? (
                            <p className="text-gray-500">Loading portals...</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {portals.map((portal) => (
                                    <button
                                        key={portal.id}
                                        type="button"
                                        onClick={() => setSelectedPortalId(portal.id)}
                                        className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm hover:border-blue-400 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    >
                                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">{portal.key}</span>
                                        <span className="mt-2 text-xl font-semibold text-gray-900">{portal.name}</span>
                                        {portal.domain ? (
                                            <span className="mt-1 text-sm text-gray-500 truncate">{portal.domain}</span>
                                        ) : null}
                                    </button>
                                ))}
                            </div>
                        )}
                        {!portalsLoading && portals.length === 0 && (
                            <p className="text-gray-500">No portals configured.</p>
                        )}
                    </>
                ) : (
                    <>
                    <div className="flex flex-row justify-between items-center ">
                            <span className="text-gray-600 pb-5">
                                Portal: <strong>{selectedPortal?.name ?? selectedPortal?.key ?? selectedPortalId}</strong>
                            </span>

                            <button
                                type="button"
                                onClick={() => setSelectedPortalId(null)}
                                className="flex min-h-[36px] items-center rounded-md  py-2 px-3 text-sm font-medium uppercase  transition-colors cursor-pointer text-white bg-blue-950/90  hover:bg-blue-900"
                            >
                                Back to portals
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200">
                            {(Object.keys(TAB_LABELS) as BannerTab[]).map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                                        activeTab === tab
                                            ? 'text-blue-950 border-b-2 border-blue-950 bg-blue-50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    {TAB_LABELS[tab]}
                                </button>
                            ))}
                        </div>

                        
                        {/* Tab content */}
                        {activeTab === 'top' && (
                            <TopBannersTab
                                homePageTopBanners={homePageTopBanners}
                                customTopSections={customTopSections}
                                onAddHomeTopBanner={handleAddHomePageTopBanner}
                                onAddCustomSection={openTopCustomSectionModal}
                                onAddBannerToSection={handleAddCustomTopBanner}
                                onChangeImage={openChangeImageModal}
                                onChangeRedirection={openChangeRedirectionModal}
                                onEditSchedule={openEditScheduleForBanner}
                                onChangeAppearanceWeight={handleChangeAppearanceWeight}
                                onDeleteTopBanner={handleDeleteTopBanner}
                                onEditRoute={openEditRouteModal}
                                onDeleteSection={openDeleteModal}
                                onSaveSchedule={saveBannerScheduleInline}
                            />
                        )}
                        {activeTab === 'middle' && (
                            <MiddleBannersTab
                                generalMediumBanners={generalMediumBanners}
                                customMediumSections={customMediumSections}
                                onAddGeneralMediumBanner={handleAddGeneralMediumBanner}
                                onAddCustomSection={openMediumCustomSectionModal}
                                onAddBannerToSection={handleAddCustomMediumBanner}
                                onChangeImage={openChangeImageModal}
                                onChangeRedirection={openChangeRedirectionModal}
                                onEditSchedule={openEditScheduleForBanner}
                                onChangeAppearanceWeight={handleChangeAppearanceWeight}
                                onDeleteMediumBanner={handleDeleteMediumBanner}
                                onEditRoute={openEditRouteModal}
                                onDeleteSection={openDeleteModal}
                                onSaveSchedule={saveBannerScheduleInline}
                            />
                        )}
                        {activeTab === 'right' && (
                            <RightBannersTab
                                homePageRightBanners={homePageRightBanners}
                                customRightSections={customRightSections}
                                onAddHomeRightBanner={handleAddHomePageRightBanner}
                                onAddCustomSection={openRightCustomSectionModal}
                                onAddBannerToSection={handleAddCustomRightBanner}
                                onChangeImage={openChangeImageModal}
                                onChangeRedirection={openChangeRedirectionModal}
                                onEditSchedule={openEditScheduleForBanner}
                                onChangeAppearanceWeight={handleChangeAppearanceWeight}
                                onDeleteRightBanner={handleDeleteRightBanner}
                                onEditRoute={openEditRouteModal}
                                onDeleteSection={openDeleteModal}
                                onSaveSchedule={saveBannerScheduleInline}
                            />
                        )}
                        {activeTab === 'expired' && (
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Expired by portal
                                    </span>
                                    {portals.map((p) => {
                                        const isActive = (expiredPortalTabId ?? selectedPortalId) === p.id;
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => {
                                                    setExpiredPortalTabId(p.id);
                                                    setSelectedPortalId(p.id);
                                                }}
                                                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                                    isActive
                                                        ? "border-blue-900 bg-blue-900 text-white"
                                                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                                                }`}
                                                title={p.domain || p.key}
                                            >
                                                {p.name || p.key || p.id}
                                            </button>
                                        );
                                    })}
                                </div>

                                <ExpiredBannersTab
                                    expiredBanners={expiredBanners}
                                    onEditSchedule={openEditScheduleForBanner}
                                    onChangeImage={openChangeImageModal}
                                    onChangeRedirection={openChangeRedirectionModal}
                                    resolveSectionForBanner={resolveSectionForBanner}
                                    onSaveSchedule={saveBannerScheduleInline}
                                />
                            </div>
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
                        <BannerScheduleModal
                            isOpen={bannerScheduleModalOpen}
                            mode={bannerScheduleModalMode}
                            defaultStartIso={bannerScheduleDefaults?.start}
                            defaultEndIso={bannerScheduleDefaults?.end}
                            onConfirm={handleBannerScheduleConfirm}
                            onCancel={handleBannerScheduleCancel}
                        />
                    </>
                )}
                    </div>
                </div>
            </div>
            </PageContentSection>
        </>
    );
};

export default Banners;
