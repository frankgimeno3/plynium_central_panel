"use client";

import React, { FC, useState, useEffect } from 'react';
import AdSectionModal from './banner_components/AdSectionModal';
import DeleteSectionModal from './banner_components/DeleteSectionModal';
import EditRouteModal from './banner_components/EditRouteModal';
import ChangeImageModal from './banner_components/ChangeImageModal';
import ChangeRedirectionModal from './banner_components/ChangeRedirectionModal';
import TopBannersTab from './banner_tabs/TopBannersTab';
import MiddleBannersTab from './banner_tabs/MiddleBannersTab';
import RightBannersTab from './banner_tabs/RightBannersTab';
import { useBanners } from './hooks/useBanners';
import { PortalService } from '@/app/service/PortalService';

type BannerTab = 'top' | 'middle' | 'right';

const TAB_LABELS: Record<BannerTab, string> = {
    top: 'Top Banners',
    middle: 'Middle Banners',
    right: 'Right Banners',
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

    useEffect(() => {
        PortalService.getAllPortals()
            .then((data: unknown) => {
                setPortals(Array.isArray(data) ? data as PortalItem[] : []);
            })
            .catch(() => setPortals([]))
            .finally(() => setPortalsLoading(false));
    }, []);

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

    return (
        <div className="flex flex-col w-full">
            <div className="text-center bg-blue-950/70 p-5 text-white">
                <p className="text-2xl">Banner management</p>
            </div>
            <div className="flex flex-col w-full gap-4 bg-white min-h-screen p-12 px-46">
                {selectedPortalId == null ? (
                    <>
                        <div className="flex items-center justify-between">
                            <p className="text-lg text-gray-700">Selecciona un portal para gestionar sus banners</p>
                        </div>
                        {portalsLoading ? (
                            <p className="text-gray-500">Cargando portales...</p>
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
                            <p className="text-gray-500">No hay portales configurados.</p>
                        )}
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setSelectedPortalId(null)}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                                ← Volver a portales
                            </button>
                            <span className="text-gray-600">
                                Portal: <strong>{selectedPortal?.name ?? selectedPortal?.key ?? selectedPortalId}</strong>
                            </span>
                        </div>
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
                    </>
                )}
            </div>
        </div>
    );
};

export default Banners;
