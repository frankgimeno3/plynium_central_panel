import { useState, useEffect, useCallback } from 'react';
import { BannerService } from '@/app/service/BannerService';

const DEFAULT_BANNER_IMAGE = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0';
const DEFAULT_BANNER_REDIRECTION = 'https://www.vidrioperfil.com';

export type AppearanceWeight = 'low' | 'medium' | 'high';

export interface Banner {
    id: string;
    portalId?: number;
    src: string;
    route: string;
    bannerRedirection: string;
    positionType: 'right' | 'top' | 'medium';
    pageType: 'home' | 'custom';
    position: number;
    /** For top/medium: display probability weight. low=1, medium=2, high=3 */
    appearanceWeight?: AppearanceWeight;
}

export interface CustomSection {
    id: string;
    name: string;
    route: string;
    banners: Banner[];
}

export const useBanners = (portalId: number | null) => {
    // Home Page Right Banners state
    const [homePageRightBanners, setHomePageRightBanners] = useState<Banner[]>([]);

    // Home Page Top Banners state (multiple with probability weights)
    const [homePageTopBanners, setHomePageTopBanners] = useState<Banner[]>([]);

    // General Medium Banners state (multiple with probability weights)
    const [generalMediumBanners, setGeneralMediumBanners] = useState<Banner[]>([]);

    // Custom Top Banners state
    const [customTopSections, setCustomTopSections] = useState<CustomSection[]>([]);

    // Custom Right Banners state
    const [customRightSections, setCustomRightSections] = useState<CustomSection[]>([]);

    // Custom Medium Banners state
    const [customMediumSections, setCustomMediumSections] = useState<CustomSection[]>([]);

    // Modal states
    const [showAdSectionModal, setShowAdSectionModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditRouteModal, setShowEditRouteModal] = useState(false);
    const [showChangeImageModal, setShowChangeImageModal] = useState(false);
    const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
    const [editSectionId, setEditSectionId] = useState<string | null>(null);
    const [editSectionType, setEditSectionType] = useState<'top' | 'right' | 'medium'>('top');
    const [adSectionType, setAdSectionType] = useState<'top' | 'right' | 'medium'>('top');
    const [changeImageBannerId, setChangeImageBannerId] = useState<string | null>(null);
    const [changeImageBannerSection, setChangeImageBannerSection] = useState<'home' | 'home-top' | 'home-medium' | string | null>(null);
    const [changeImageBannerType, setChangeImageBannerType] = useState<'top' | 'right' | 'medium' | 'home' | 'home-top' | 'home-medium' | null>(null);
    const [showChangeRedirectionModal, setShowChangeRedirectionModal] = useState(false);
    const [changeRedirectionBannerId, setChangeRedirectionBannerId] = useState<string | null>(null);
    const [changeRedirectionBannerSection, setChangeRedirectionBannerSection] = useState<'home' | 'home-top' | 'home-medium' | string | null>(null);
    const [changeRedirectionBannerType, setChangeRedirectionBannerType] = useState<'top' | 'right' | 'medium' | 'home' | 'home-top' | 'home-medium' | null>(null);

    // Helper function to generate banner ID (from current state only)
    const generateBannerId = (positionType: 'right' | 'top' | 'medium', pageType: 'home' | 'custom'): string => {
        const year = new Date().getFullYear().toString().slice(-2);
        const typeCode = positionType === 'right' ? 'r' : positionType === 'medium' ? 'm' : 't';

        const allBanners = [
            ...homePageRightBanners,
            ...homePageTopBanners,
            ...generalMediumBanners,
            ...customTopSections.flatMap(s => s.banners),
            ...customRightSections.flatMap(s => s.banners),
            ...customMediumSections.flatMap(s => s.banners)
        ];
        
        const matchingBanners = allBanners.filter(b => 
            b.id && b.id.startsWith(`banner-${typeCode}-${year}-`)
        );
        
        const numbers = matchingBanners.map(b => {
            const match = b.id.match(new RegExp(`banner-${typeCode}-${year}-(\\d+)`));
            return match ? parseInt(match[1], 10) : 0;
        });
        
        const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
        const paddedNumber = nextNumber.toString().padStart(5, '0');
        
        return `banner-${typeCode}-${year}-${paddedNumber}`;
    };

    // Map flat banner list from API to UI state
    const applyBannersListToState = useCallback((list: Banner[]) => {
        if (!list || list.length === 0) return;
        const homeRightBanners = list
            .filter(b => b.pageType === 'home' && b.positionType === 'right')
            .map(b => ({ ...b, bannerRedirection: b.bannerRedirection ?? DEFAULT_BANNER_REDIRECTION }))
            .sort((a, b) => a.position - b.position);
        setHomePageRightBanners(homeRightBanners);

        const homeTopBanners = list
            .filter(b => b.pageType === 'home' && b.positionType === 'top')
            .map(b => ({ ...b, bannerRedirection: b.bannerRedirection ?? DEFAULT_BANNER_REDIRECTION, appearanceWeight: (b.appearanceWeight ?? 'medium') as AppearanceWeight }))
            .sort((a, b) => a.position - b.position);
        setHomePageTopBanners(homeTopBanners);

        const generalMediumBannersList = list
            .filter(b => b.pageType === 'home' && b.positionType === 'medium')
            .map(b => ({ ...b, bannerRedirection: b.bannerRedirection ?? DEFAULT_BANNER_REDIRECTION, appearanceWeight: (b.appearanceWeight ?? 'medium') as AppearanceWeight }))
            .sort((a, b) => a.position - b.position);
        setGeneralMediumBanners(generalMediumBannersList);

        const customBanners = list.filter(b => b.pageType === 'custom');
        const toSection = (route: string, banners: Banner[], prefix = 'section-') => ({
            id: `${prefix}${route.replace(/\//g, '-')}`,
            name: `Custom Page - ${route}`,
            route,
            banners: banners.sort((a, b) => a.position - b.position)
        });
        const groupByRoute = (positionType: 'right' | 'top' | 'medium') => {
            const byRoute = customBanners
                .filter(b => b.positionType === positionType)
                .reduce((acc, b) => {
                    if (!acc[b.route]) acc[b.route] = [];
                    acc[b.route].push({
                        ...b,
                        bannerRedirection: b.bannerRedirection ?? DEFAULT_BANNER_REDIRECTION,
                        appearanceWeight: (b.appearanceWeight ?? 'medium') as AppearanceWeight,
                    });
                    return acc;
                }, {} as Record<string, Banner[]>);
            return Object.entries(byRoute).map(([route, banners]) => toSection(route, banners, positionType === 'medium' ? 'section-medium-' : 'section-'));
        };
        setCustomRightSections(groupByRoute('right'));
        setCustomTopSections(groupByRoute('top'));
        setCustomMediumSections(groupByRoute('medium'));
    }, []);

    // Reset banner state when portal changes; load banners for the selected portal only
    useEffect(() => {
        setHomePageRightBanners([]);
        setHomePageTopBanners([]);
        setGeneralMediumBanners([]);
        setCustomTopSections([]);
        setCustomRightSections([]);
        setCustomMediumSections([]);
        if (portalId == null) return;
        let cancelled = false;
        BannerService.getBannersByPortalId(portalId)
            .then((data) => {
                if (cancelled) return;
                const list = Array.isArray(data) ? data : (data as { banners?: Banner[] })?.banners;
                if (list && list.length > 0) {
                    applyBannersListToState(list as Banner[]);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    const status = (err as { status?: number })?.status;
                    const msg = (err as { message?: string })?.message;
                    const body = (err as { data?: unknown })?.data;
                    console.error('Error loading banners from API:', { status, message: msg, data: body });
                }
            });
        return () => { cancelled = true; };
    }, [portalId, applyBannersListToState]);

    // Move banner up/down handlers
    const handleMoveBannerUp = (bannerId: string, section: 'home' | string, sectionType?: 'top' | 'right' | 'medium') => {
        if (section === 'home') {
            const sortedBanners = [...homePageRightBanners].sort((a, b) => a.position - b.position);
            const bannerIndex = sortedBanners.findIndex(b => b.id === bannerId);

            if (bannerIndex > 0) {
                const newBanners = [...sortedBanners];
                [newBanners[bannerIndex - 1], newBanners[bannerIndex]] = [newBanners[bannerIndex], newBanners[bannerIndex - 1]];
                const updatedBanners = newBanners.map((banner, index) => ({
                    ...banner,
                    position: index
                }));
                setHomePageRightBanners(updatedBanners);
                updatedBanners.forEach((b) => BannerService.updateBanner(b.id, { position: b.position }).catch((err) => console.error('Error persisting order:', err)));
            }
        } else {
            if (sectionType === 'top') {
                const sectionIndex = customTopSections.findIndex(s => s.id === section);
                if (sectionIndex !== -1) {
                    const newSections = [...customTopSections];
                    const sectionData = newSections[sectionIndex];
                    const sortedBanners = [...sectionData.banners].sort((a, b) => a.position - b.position);
                    const bannerIndex = sortedBanners.findIndex(b => b.id === bannerId);

                    if (bannerIndex > 0) {
                        const newBanners = [...sortedBanners];
                        [newBanners[bannerIndex - 1], newBanners[bannerIndex]] = [newBanners[bannerIndex], newBanners[bannerIndex - 1]];
                        const updatedBanners = newBanners.map((banner, index) => ({
                            ...banner,
                            position: index
                        }));
                        sectionData.banners = updatedBanners;
                        setCustomTopSections(newSections);
                        updatedBanners.forEach((b) => BannerService.updateBanner(b.id, { position: b.position }).catch((err) => console.error('Error persisting order:', err)));
                    }
                }
            } else if (sectionType === 'medium') {
                const sectionIndex = customMediumSections.findIndex(s => s.id === section);
                if (sectionIndex !== -1) {
                    const newSections = [...customMediumSections];
                    const sectionData = newSections[sectionIndex];
                    const sortedBanners = [...sectionData.banners].sort((a, b) => a.position - b.position);
                    const bannerIndex = sortedBanners.findIndex(b => b.id === bannerId);

                    if (bannerIndex > 0) {
                        const newBanners = [...sortedBanners];
                        [newBanners[bannerIndex - 1], newBanners[bannerIndex]] = [newBanners[bannerIndex], newBanners[bannerIndex - 1]];
                        const updatedBanners = newBanners.map((banner, index) => ({
                            ...banner,
                            position: index
                        }));
                        sectionData.banners = updatedBanners;
                        setCustomMediumSections(newSections);
                        updatedBanners.forEach((b) => BannerService.updateBanner(b.id, { position: b.position }).catch((err) => console.error('Error persisting order:', err)));
                    }
                }
            } else {
                const sectionIndex = customRightSections.findIndex(s => s.id === section);
                if (sectionIndex !== -1) {
                    const newSections = [...customRightSections];
                    const sectionData = newSections[sectionIndex];
                    const sortedBanners = [...sectionData.banners].sort((a, b) => a.position - b.position);
                    const bannerIndex = sortedBanners.findIndex(b => b.id === bannerId);

                    if (bannerIndex > 0) {
                        const newBanners = [...sortedBanners];
                        [newBanners[bannerIndex - 1], newBanners[bannerIndex]] = [newBanners[bannerIndex], newBanners[bannerIndex - 1]];
                        const updatedBanners = newBanners.map((banner, index) => ({
                            ...banner,
                            position: index
                        }));
                        sectionData.banners = updatedBanners;
                        setCustomRightSections(newSections);
                        updatedBanners.forEach((b) => BannerService.updateBanner(b.id, { position: b.position }).catch((err) => console.error('Error persisting order:', err)));
                    }
                }
            }
        }
    };

    const handleMoveBannerDown = (bannerId: string, section: 'home' | string, sectionType?: 'top' | 'right' | 'medium') => {
        if (section === 'home') {
            const sortedBanners = [...homePageRightBanners].sort((a, b) => a.position - b.position);
            const bannerIndex = sortedBanners.findIndex(b => b.id === bannerId);

            if (bannerIndex < sortedBanners.length - 1) {
                const newBanners = [...sortedBanners];
                [newBanners[bannerIndex], newBanners[bannerIndex + 1]] = [newBanners[bannerIndex + 1], newBanners[bannerIndex]];
                const updatedBanners = newBanners.map((banner, index) => ({
                    ...banner,
                    position: index
                }));
                setHomePageRightBanners(updatedBanners);
                updatedBanners.forEach((b) => BannerService.updateBanner(b.id, { position: b.position }).catch((err) => console.error('Error persisting order:', err)));
            }
        } else {
            if (sectionType === 'top') {
                const sectionIndex = customTopSections.findIndex(s => s.id === section);
                if (sectionIndex !== -1) {
                    const newSections = [...customTopSections];
                    const sectionData = newSections[sectionIndex];
                    const sortedBanners = [...sectionData.banners].sort((a, b) => a.position - b.position);
                    const bannerIndex = sortedBanners.findIndex(b => b.id === bannerId);

                    if (bannerIndex < sortedBanners.length - 1) {
                        const newBanners = [...sortedBanners];
                        [newBanners[bannerIndex], newBanners[bannerIndex + 1]] = [newBanners[bannerIndex + 1], newBanners[bannerIndex]];
                        const updatedBanners = newBanners.map((banner, index) => ({
                            ...banner,
                            position: index
                        }));
                        sectionData.banners = updatedBanners;
                        setCustomTopSections(newSections);
                        updatedBanners.forEach((b) => BannerService.updateBanner(b.id, { position: b.position }).catch((err) => console.error('Error persisting order:', err)));
                    }
                }
            } else if (sectionType === 'medium') {
                const sectionIndex = customMediumSections.findIndex(s => s.id === section);
                if (sectionIndex !== -1) {
                    const newSections = [...customMediumSections];
                    const sectionData = newSections[sectionIndex];
                    const sortedBanners = [...sectionData.banners].sort((a, b) => a.position - b.position);
                    const bannerIndex = sortedBanners.findIndex(b => b.id === bannerId);

                    if (bannerIndex < sortedBanners.length - 1) {
                        const newBanners = [...sortedBanners];
                        [newBanners[bannerIndex], newBanners[bannerIndex + 1]] = [newBanners[bannerIndex + 1], newBanners[bannerIndex]];
                        const updatedBanners = newBanners.map((banner, index) => ({
                            ...banner,
                            position: index
                        }));
                        sectionData.banners = updatedBanners;
                        setCustomMediumSections(newSections);
                        updatedBanners.forEach((b) => BannerService.updateBanner(b.id, { position: b.position }).catch((err) => console.error('Error persisting order:', err)));
                    }
                }
            } else {
                const sectionIndex = customRightSections.findIndex(s => s.id === section);
                if (sectionIndex !== -1) {
                    const newSections = [...customRightSections];
                    const sectionData = newSections[sectionIndex];
                    const sortedBanners = [...sectionData.banners].sort((a, b) => a.position - b.position);
                    const bannerIndex = sortedBanners.findIndex(b => b.id === bannerId);

                    if (bannerIndex < sortedBanners.length - 1) {
                        const newBanners = [...sortedBanners];
                        [newBanners[bannerIndex], newBanners[bannerIndex + 1]] = [newBanners[bannerIndex + 1], newBanners[bannerIndex]];
                        const updatedBanners = newBanners.map((banner, index) => ({
                            ...banner,
                            position: index
                        }));
                        sectionData.banners = updatedBanners;
                        setCustomRightSections(newSections);
                        updatedBanners.forEach((b) => BannerService.updateBanner(b.id, { position: b.position }).catch((err) => console.error('Error persisting order:', err)));
                    }
                }
            }
        }
    };

    const handleAddHomePageTopBanner = () => {
        if (portalId == null) return;
        const newBanner: Banner = {
            id: generateBannerId('top', 'home'),
            src: DEFAULT_BANNER_IMAGE,
            route: '/',
            bannerRedirection: DEFAULT_BANNER_REDIRECTION,
            positionType: 'top',
            pageType: 'home',
            position: homePageTopBanners.length,
            appearanceWeight: 'medium',
        };
        setHomePageTopBanners([...homePageTopBanners, newBanner]);
        BannerService.createBanner({ ...newBanner, portalId }).catch((err) => console.error('Error persisting banner:', err));
    };

    const handleAddGeneralMediumBanner = () => {
        if (portalId == null) return;
        const newBanner: Banner = {
            id: generateBannerId('medium', 'home'),
            src: DEFAULT_BANNER_IMAGE,
            route: '/',
            bannerRedirection: DEFAULT_BANNER_REDIRECTION,
            positionType: 'medium',
            pageType: 'home',
            position: generalMediumBanners.length,
            appearanceWeight: 'medium',
        };
        setGeneralMediumBanners([...generalMediumBanners, newBanner]);
        BannerService.createBanner({ ...newBanner, portalId }).catch((err) => console.error('Error persisting banner:', err));
    };

    const handleAddHomePageRightBanner = () => {
        if (portalId == null) return;
        const newBanner: Banner = {
            id: generateBannerId('right', 'home'),
            src: DEFAULT_BANNER_IMAGE,
            route: '/',
            bannerRedirection: DEFAULT_BANNER_REDIRECTION,
            positionType: 'right',
            pageType: 'home',
            position: homePageRightBanners.length,
            appearanceWeight: 'medium',
        };
        setHomePageRightBanners([...homePageRightBanners, newBanner]);
        BannerService.createBanner({ ...newBanner, portalId }).catch((err) => console.error('Error persisting banner:', err));
    };

    const handleAddCustomRightBanner = (sectionId: string) => {
        if (portalId == null) return;
        const sectionIndex = customRightSections.findIndex(s => s.id === sectionId);
        if (sectionIndex !== -1) {
            const newSections = [...customRightSections];
            const section = newSections[sectionIndex];
            const newBanner: Banner = {
                id: generateBannerId('right', 'custom'),
                src: DEFAULT_BANNER_IMAGE,
                route: section.route,
                bannerRedirection: DEFAULT_BANNER_REDIRECTION,
                positionType: 'right',
                pageType: 'custom',
                position: section.banners.length,
                appearanceWeight: 'medium',
            };
            section.banners = [...section.banners, newBanner];
            setCustomRightSections(newSections);
            BannerService.createBanner({ ...newBanner, portalId }).catch((err) => console.error('Error persisting banner:', err));
        }
    };

    const handleAddCustomTopBanner = (sectionId: string) => {
        if (portalId == null) return;
        const sectionIndex = customTopSections.findIndex(s => s.id === sectionId);
        if (sectionIndex !== -1) {
            const newSections = [...customTopSections];
            const section = newSections[sectionIndex];
            const newBanner: Banner = {
                id: generateBannerId('top', 'custom'),
                src: DEFAULT_BANNER_IMAGE,
                route: section.route,
                bannerRedirection: DEFAULT_BANNER_REDIRECTION,
                positionType: 'top',
                pageType: 'custom',
                position: section.banners.length,
                appearanceWeight: 'medium',
            };
            section.banners = [...section.banners, newBanner];
            setCustomTopSections(newSections);
            BannerService.createBanner({ ...newBanner, portalId }).catch((err) => console.error('Error persisting banner:', err));
        }
    };

    const handleChangeAppearanceWeight = (bannerId: string, section: 'home-top' | 'home-medium' | 'home' | string, weight: AppearanceWeight) => {
        const persist = () => BannerService.updateBanner(bannerId, { appearanceWeight: weight }).catch((err) => console.error('Error persisting appearance weight:', err));
        if (section === 'home-top') {
            setHomePageTopBanners(homePageTopBanners.map(b => (b.id === bannerId ? { ...b, appearanceWeight: weight } : b)));
            persist();
        } else if (section === 'home-medium') {
            setGeneralMediumBanners(generalMediumBanners.map(b => (b.id === bannerId ? { ...b, appearanceWeight: weight } : b)));
            persist();
        } else if (section === 'home') {
            setHomePageRightBanners(homePageRightBanners.map(b => (b.id === bannerId ? { ...b, appearanceWeight: weight } : b)));
            persist();
        } else {
            const topIdx = customTopSections.findIndex(s => s.id === section);
            if (topIdx !== -1) {
                const newSections = [...customTopSections];
                const sec = newSections[topIdx];
                sec.banners = sec.banners.map(b => (b.id === bannerId ? { ...b, appearanceWeight: weight } : b));
                setCustomTopSections(newSections);
                persist();
                return;
            }
            const mediumIdx = customMediumSections.findIndex(s => s.id === section);
            if (mediumIdx !== -1) {
                const newSections = [...customMediumSections];
                const sec = newSections[mediumIdx];
                sec.banners = sec.banners.map(b => (b.id === bannerId ? { ...b, appearanceWeight: weight } : b));
                setCustomMediumSections(newSections);
                persist();
                return;
            }
            const rightIdx = customRightSections.findIndex(s => s.id === section);
            if (rightIdx !== -1) {
                const newSections = [...customRightSections];
                const sec = newSections[rightIdx];
                sec.banners = sec.banners.map(b => (b.id === bannerId ? { ...b, appearanceWeight: weight } : b));
                setCustomRightSections(newSections);
                persist();
            }
        }
    };

    const handleDeleteTopBanner = (bannerId: string, section: 'home-top' | string) => {
        if (section === 'home-top') {
            const updated = homePageTopBanners.filter(b => b.id !== bannerId).map((b, i) => ({ ...b, position: i }));
            setHomePageTopBanners(updated);
            BannerService.deleteBanner(bannerId).catch((err) => console.error('Error deleting banner:', err));
            updated.forEach((b, i) => BannerService.updateBanner(b.id, { position: i }).catch(() => {}));
        } else {
            const sectionIndex = customTopSections.findIndex(s => s.id === section);
            if (sectionIndex !== -1) {
                const newSections = [...customTopSections];
                const sec = newSections[sectionIndex];
                sec.banners = sec.banners.filter(b => b.id !== bannerId).map((b, i) => ({ ...b, position: i }));
                setCustomTopSections(newSections);
                BannerService.deleteBanner(bannerId).catch((err) => console.error('Error deleting banner:', err));
                sec.banners.forEach((b, i) => BannerService.updateBanner(b.id, { position: i }).catch(() => {}));
            }
        }
    };

    const handleDeleteMediumBanner = (bannerId: string, section: 'home-medium' | string) => {
        if (section === 'home-medium') {
            const updated = generalMediumBanners.filter(b => b.id !== bannerId).map((b, i) => ({ ...b, position: i }));
            setGeneralMediumBanners(updated);
            BannerService.deleteBanner(bannerId).catch((err) => console.error('Error deleting banner:', err));
            updated.forEach((b, i) => BannerService.updateBanner(b.id, { position: i }).catch(() => {}));
        } else {
            const sectionIndex = customMediumSections.findIndex(s => s.id === section);
            if (sectionIndex !== -1) {
                const newSections = [...customMediumSections];
                const sec = newSections[sectionIndex];
                sec.banners = sec.banners.filter(b => b.id !== bannerId).map((b, i) => ({ ...b, position: i }));
                setCustomMediumSections(newSections);
                BannerService.deleteBanner(bannerId).catch((err) => console.error('Error deleting banner:', err));
                sec.banners.forEach((b, i) => BannerService.updateBanner(b.id, { position: i }).catch(() => {}));
            }
        }
    };

    const handleDeleteRightBanner = (bannerId: string, section: 'home' | string) => {
        if (section === 'home') {
            const updated = homePageRightBanners.filter(b => b.id !== bannerId).map((b, i) => ({ ...b, position: i }));
            setHomePageRightBanners(updated);
            BannerService.deleteBanner(bannerId).catch((err) => console.error('Error deleting banner:', err));
            updated.forEach((b, i) => BannerService.updateBanner(b.id, { position: i }).catch(() => {}));
        } else {
            const sectionIndex = customRightSections.findIndex(s => s.id === section);
            if (sectionIndex !== -1) {
                const newSections = [...customRightSections];
                const sec = newSections[sectionIndex];
                sec.banners = sec.banners.filter(b => b.id !== bannerId).map((b, i) => ({ ...b, position: i }));
                setCustomRightSections(newSections);
                BannerService.deleteBanner(bannerId).catch((err) => console.error('Error deleting banner:', err));
                sec.banners.forEach((b, i) => BannerService.updateBanner(b.id, { position: i }).catch(() => {}));
            }
        }
    };

    const handleAddCustomMediumBanner = (sectionId: string) => {
        if (portalId == null) return;
        const sectionIndex = customMediumSections.findIndex(s => s.id === sectionId);
        if (sectionIndex !== -1) {
            const newSections = [...customMediumSections];
            const section = newSections[sectionIndex];
            const newBanner: Banner = {
                id: generateBannerId('medium', 'custom'),
                src: DEFAULT_BANNER_IMAGE,
                route: section.route,
                bannerRedirection: DEFAULT_BANNER_REDIRECTION,
                positionType: 'medium',
                pageType: 'custom',
                position: section.banners.length,
                appearanceWeight: 'medium',
            };
            section.banners = [...section.banners, newBanner];
            setCustomMediumSections(newSections);
            BannerService.createBanner({ ...newBanner, portalId }).catch((err) => console.error('Error persisting banner:', err));
        }
    };

    const handleAddCustomSection = (sectionName: string, sectionRoute: string, bannerSrc?: string) => {
        if (portalId == null) return;
        const routeSlug = sectionRoute.replace(/\//g, '-');
        const newSection: CustomSection = {
            id: adSectionType === 'medium' ? `section-medium-${routeSlug}-${Date.now()}` : `section-${routeSlug}-${Date.now()}`,
            name: sectionName,
            route: sectionRoute,
            banners: []
        };

        if ((adSectionType === 'top' || adSectionType === 'medium') && bannerSrc) {
            const newBanner: Banner = {
                id: generateBannerId(adSectionType, 'custom'),
                src: bannerSrc,
                route: sectionRoute,
                bannerRedirection: DEFAULT_BANNER_REDIRECTION,
                positionType: adSectionType,
                pageType: 'custom',
                position: 0,
                appearanceWeight: 'medium',
            };
            newSection.banners = [newBanner];
            BannerService.createBanner({ ...newBanner, portalId }).catch((err) => console.error('Error persisting banner:', err));
        }

        if (adSectionType === 'top') {
            setCustomTopSections([...customTopSections, newSection]);
        } else if (adSectionType === 'medium') {
            setCustomMediumSections([...customMediumSections, newSection]);
        } else {
            setCustomRightSections([...customRightSections, newSection]);
        }
        setShowAdSectionModal(false);
    };

    const handleDeleteSection = () => {
        if (!deleteSectionId) return;
        const section =
            editSectionType === 'top'
                ? customTopSections.find(s => s.id === deleteSectionId)
                : editSectionType === 'medium'
                    ? customMediumSections.find(s => s.id === deleteSectionId)
                    : customRightSections.find(s => s.id === deleteSectionId);
        const bannerIds = section?.banners?.map(b => b.id) ?? [];
        if (editSectionType === 'top') {
            setCustomTopSections(customTopSections.filter(s => s.id !== deleteSectionId));
        } else if (editSectionType === 'medium') {
            setCustomMediumSections(customMediumSections.filter(s => s.id !== deleteSectionId));
        } else {
            setCustomRightSections(customRightSections.filter(s => s.id !== deleteSectionId));
        }
        setShowDeleteModal(false);
        setDeleteSectionId(null);
        bannerIds.forEach((id) => BannerService.deleteBanner(id).catch((err) => console.error('Error deleting banner:', err)));
    };

    const handleEditRoute = (newRoute: string) => {
        if (!editSectionId) return;
        const section =
            editSectionType === 'top'
                ? customTopSections.find(s => s.id === editSectionId)
                : editSectionType === 'medium'
                    ? customMediumSections.find(s => s.id === editSectionId)
                    : customRightSections.find(s => s.id === editSectionId);
        const bannersToUpdate = section?.banners ?? [];
        if (editSectionType === 'top') {
            setCustomTopSections(customTopSections.map(s =>
                s.id === editSectionId ? { ...s, route: newRoute, banners: s.banners.map(b => ({ ...b, route: newRoute })) } : s
            ));
        } else if (editSectionType === 'medium') {
            setCustomMediumSections(customMediumSections.map(s =>
                s.id === editSectionId ? { ...s, route: newRoute, banners: s.banners.map(b => ({ ...b, route: newRoute })) } : s
            ));
        } else {
            setCustomRightSections(customRightSections.map(s =>
                s.id === editSectionId ? { ...s, route: newRoute, banners: s.banners.map(b => ({ ...b, route: newRoute })) } : s
            ));
        }
        setShowEditRouteModal(false);
        setEditSectionId(null);
        bannersToUpdate.forEach((b) =>
            BannerService.updateBanner(b.id, { route: newRoute }).catch((err) => console.error('Error updating banner route:', err))
        );
    };

    const openDeleteModal = (sectionId: string, type: 'top' | 'right' | 'medium') => {
        setDeleteSectionId(sectionId);
        setEditSectionType(type);
        setShowDeleteModal(true);
    };

    const openEditRouteModal = (sectionId: string, type: 'top' | 'right' | 'medium') => {
        setEditSectionId(sectionId);
        setEditSectionType(type);
        setShowEditRouteModal(true);
    };

    const getCurrentRoute = (): string => {
        if (!editSectionId) return '';
        if (editSectionType === 'top') {
            const section = customTopSections.find(s => s.id === editSectionId);
            return section?.route || '';
        } else if (editSectionType === 'medium') {
            const section = customMediumSections.find(s => s.id === editSectionId);
            return section?.route || '';
        } else {
            const section = customRightSections.find(s => s.id === editSectionId);
            return section?.route || '';
        }
    };

    const openChangeImageModal = (bannerId: string, section: 'home' | 'home-top' | 'home-medium' | string, type?: 'top' | 'right' | 'medium') => {
        setChangeImageBannerId(bannerId);
        setChangeImageBannerSection(section);
        if (section === 'home-top') {
            setChangeImageBannerType('home-top');
        } else if (section === 'home-medium') {
            setChangeImageBannerType('home-medium');
        } else if (section === 'home') {
            setChangeImageBannerType('home');
        } else {
            setChangeImageBannerType(type || null);
        }
        setShowChangeImageModal(true);
    };

    const getCurrentBannerSrc = (): string => {
        if (!changeImageBannerId) return '';
        
        if (changeImageBannerSection === 'home-top') {
            const banner = homePageTopBanners.find(b => b.id === changeImageBannerId);
            return banner?.src ?? '';
        } else if (changeImageBannerSection === 'home-medium') {
            const banner = generalMediumBanners.find(b => b.id === changeImageBannerId);
            return banner?.src ?? '';
        } else if (changeImageBannerSection === 'home') {
            const banner = homePageRightBanners.find(b => b.id === changeImageBannerId);
            return banner?.src || '';
        } else if (changeImageBannerType === 'top') {
            const section = customTopSections.find(s => s.id === changeImageBannerSection);
            const banner = section?.banners.find(b => b.id === changeImageBannerId);
            return banner?.src || '';
        } else if (changeImageBannerType === 'medium') {
            const section = customMediumSections.find(s => s.id === changeImageBannerSection);
            const banner = section?.banners.find(b => b.id === changeImageBannerId);
            return banner?.src || '';
        } else if (changeImageBannerType === 'right') {
            const section = customRightSections.find(s => s.id === changeImageBannerSection);
            const banner = section?.banners.find(b => b.id === changeImageBannerId);
            return banner?.src || '';
        }
        return '';
    };

    const handleChangeImage = (newSrc: string) => {
        if (!changeImageBannerId) return;

        if (changeImageBannerSection === 'home-top') {
            setHomePageTopBanners(homePageTopBanners.map(b =>
                b.id === changeImageBannerId ? { ...b, src: newSrc } : b
            ));
        } else if (changeImageBannerSection === 'home-medium') {
            setGeneralMediumBanners(generalMediumBanners.map(b =>
                b.id === changeImageBannerId ? { ...b, src: newSrc } : b
            ));
        } else if (changeImageBannerSection === 'home') {
            setHomePageRightBanners(homePageRightBanners.map(banner =>
                banner.id === changeImageBannerId ? { ...banner, src: newSrc } : banner
            ));
        } else if (changeImageBannerType === 'top') {
            const sectionIndex = customTopSections.findIndex(s => s.id === changeImageBannerSection);
            if (sectionIndex !== -1) {
                const newSections = [...customTopSections];
                const section = newSections[sectionIndex];
                section.banners = section.banners.map(banner =>
                    banner.id === changeImageBannerId ? { ...banner, src: newSrc } : banner
                );
                setCustomTopSections(newSections);
            }
        } else if (changeImageBannerType === 'medium') {
            const sectionIndex = customMediumSections.findIndex(s => s.id === changeImageBannerSection);
            if (sectionIndex !== -1) {
                const newSections = [...customMediumSections];
                const section = newSections[sectionIndex];
                section.banners = section.banners.map(banner =>
                    banner.id === changeImageBannerId ? { ...banner, src: newSrc } : banner
                );
                setCustomMediumSections(newSections);
            }
        } else if (changeImageBannerType === 'right') {
            const sectionIndex = customRightSections.findIndex(s => s.id === changeImageBannerSection);
            if (sectionIndex !== -1) {
                const newSections = [...customRightSections];
                const section = newSections[sectionIndex];
                section.banners = section.banners.map(banner =>
                    banner.id === changeImageBannerId ? { ...banner, src: newSrc } : banner
                );
                setCustomRightSections(newSections);
            }
        }

        BannerService.updateBanner(changeImageBannerId, { src: newSrc }).catch((err) => console.error('Error persisting banner image:', err));
        setShowChangeImageModal(false);
        setChangeImageBannerId(null);
        setChangeImageBannerSection(null);
        setChangeImageBannerType(null);
    };

    const openChangeRedirectionModal = (bannerId: string, section: 'home' | 'home-top' | 'home-medium' | string, type?: 'top' | 'right' | 'medium') => {
        setChangeRedirectionBannerId(bannerId);
        setChangeRedirectionBannerSection(section);
        if (section === 'home-top') {
            setChangeRedirectionBannerType('home-top');
        } else if (section === 'home-medium') {
            setChangeRedirectionBannerType('home-medium');
        } else if (section === 'home') {
            setChangeRedirectionBannerType('home');
        } else {
            setChangeRedirectionBannerType(type || null);
        }
        setShowChangeRedirectionModal(true);
    };

    const getCurrentBannerRedirection = (): string => {
        if (!changeRedirectionBannerId) return '';
        if (changeRedirectionBannerSection === 'home-top') {
            const banner = homePageTopBanners.find(b => b.id === changeRedirectionBannerId);
            return banner?.bannerRedirection ?? '';
        } else if (changeRedirectionBannerSection === 'home-medium') {
            const banner = generalMediumBanners.find(b => b.id === changeRedirectionBannerId);
            return banner?.bannerRedirection ?? '';
        } else if (changeRedirectionBannerSection === 'home') {
            const banner = homePageRightBanners.find(b => b.id === changeRedirectionBannerId);
            return banner?.bannerRedirection || '';
        } else if (changeRedirectionBannerType === 'top') {
            const section = customTopSections.find(s => s.id === changeRedirectionBannerSection);
            const banner = section?.banners.find(b => b.id === changeRedirectionBannerId);
            return banner?.bannerRedirection || '';
        } else if (changeRedirectionBannerType === 'medium') {
            const section = customMediumSections.find(s => s.id === changeRedirectionBannerSection);
            const banner = section?.banners.find(b => b.id === changeRedirectionBannerId);
            return banner?.bannerRedirection || '';
        } else if (changeRedirectionBannerType === 'right') {
            const section = customRightSections.find(s => s.id === changeRedirectionBannerSection);
            const banner = section?.banners.find(b => b.id === changeRedirectionBannerId);
            return banner?.bannerRedirection || '';
        }
        return '';
    };

    const handleChangeRedirection = (newUrl: string) => {
        if (!changeRedirectionBannerId) return;
        if (changeRedirectionBannerSection === 'home-top') {
            setHomePageTopBanners(homePageTopBanners.map(b =>
                b.id === changeRedirectionBannerId ? { ...b, bannerRedirection: newUrl } : b
            ));
        } else if (changeRedirectionBannerSection === 'home-medium') {
            setGeneralMediumBanners(generalMediumBanners.map(b =>
                b.id === changeRedirectionBannerId ? { ...b, bannerRedirection: newUrl } : b
            ));
        } else if (changeRedirectionBannerSection === 'home') {
            setHomePageRightBanners(homePageRightBanners.map(banner =>
                banner.id === changeRedirectionBannerId ? { ...banner, bannerRedirection: newUrl } : banner
            ));
        } else if (changeRedirectionBannerType === 'top') {
            const sectionIndex = customTopSections.findIndex(s => s.id === changeRedirectionBannerSection);
            if (sectionIndex !== -1) {
                const newSections = [...customTopSections];
                const section = newSections[sectionIndex];
                section.banners = section.banners.map(banner =>
                    banner.id === changeRedirectionBannerId ? { ...banner, bannerRedirection: newUrl } : banner
                );
                setCustomTopSections(newSections);
            }
        } else if (changeRedirectionBannerType === 'medium') {
            const sectionIndex = customMediumSections.findIndex(s => s.id === changeRedirectionBannerSection);
            if (sectionIndex !== -1) {
                const newSections = [...customMediumSections];
                const section = newSections[sectionIndex];
                section.banners = section.banners.map(banner =>
                    banner.id === changeRedirectionBannerId ? { ...banner, bannerRedirection: newUrl } : banner
                );
                setCustomMediumSections(newSections);
            }
        } else if (changeRedirectionBannerType === 'right') {
            const sectionIndex = customRightSections.findIndex(s => s.id === changeRedirectionBannerSection);
            if (sectionIndex !== -1) {
                const newSections = [...customRightSections];
                const section = newSections[sectionIndex];
                section.banners = section.banners.map(banner =>
                    banner.id === changeRedirectionBannerId ? { ...banner, bannerRedirection: newUrl } : banner
                );
                setCustomRightSections(newSections);
            }
        }
        BannerService.updateBanner(changeRedirectionBannerId, { bannerRedirection: newUrl }).catch((err) => console.error('Error persisting banner redirection:', err));
        setShowChangeRedirectionModal(false);
        setChangeRedirectionBannerId(null);
        setChangeRedirectionBannerSection(null);
        setChangeRedirectionBannerType(null);
    };

    return {
        // State
        homePageRightBanners,
        homePageTopBanners,
        generalMediumBanners,
        customTopSections,
        customRightSections,
        customMediumSections,
        showAdSectionModal,
        showDeleteModal,
        showEditRouteModal,
        showChangeImageModal,
        showChangeRedirectionModal,
        deleteSectionId,
        editSectionId,
        editSectionType,
        adSectionType,
        // Setters
        setShowAdSectionModal,
        setShowDeleteModal,
        setShowEditRouteModal,
        setShowChangeImageModal,
        setShowChangeRedirectionModal,
        setDeleteSectionId,
        setEditSectionId,
        setEditSectionType,
        setAdSectionType,
        // Handlers
        handleMoveBannerUp,
        handleMoveBannerDown,
        handleAddHomePageTopBanner,
        handleAddGeneralMediumBanner,
        handleAddHomePageRightBanner,
        handleAddCustomRightBanner,
        handleAddCustomTopBanner,
        handleChangeAppearanceWeight,
        handleDeleteTopBanner,
        handleDeleteMediumBanner,
        handleDeleteRightBanner,
        handleAddCustomMediumBanner,
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
    };
};
