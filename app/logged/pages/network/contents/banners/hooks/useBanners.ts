import { useState, useEffect, useCallback } from 'react';
import { BannerService } from '@/app/service/BannerService';
import { addOneYearYmd, todayYmd } from '../bannerDateUtils';

const DEFAULT_BANNER_IMAGE = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0';
const DEFAULT_BANNER_REDIRECTION = 'https://www.vidrioperfil.com';

const decodeRepeatedly = (value: string) => {
    let current = value;

    for (let i = 0; i < 3; i += 1) {
        try {
            const decoded = decodeURIComponent(current);
            if (decoded === current) break;
            current = decoded;
        } catch {
            break;
        }
    }

    return current;
};

const normalizeBannerSrc = (src: string) => {
    const trimmedSrc = src.trim();
    if (!trimmedSrc || trimmedSrc.startsWith('data:')) return trimmedSrc;

    try {
        const parsed = new URL(trimmedSrc);
        parsed.pathname = parsed.pathname
            .split('/')
            .map((segment) => encodeURIComponent(decodeRepeatedly(segment)))
            .join('/');
        return parsed.toString();
    } catch {
        return trimmedSrc;
    }
};

const getErrorDetails = (error: unknown) => {
    if (error && typeof error === 'object') {
        const maybeError = error as { message?: unknown; status?: unknown; data?: unknown };
        return {
            message: typeof maybeError.message === 'string' ? maybeError.message : 'Unknown error',
            status: maybeError.status,
            data: maybeError.data,
        };
    }

    return { message: String(error) };
};

export type AppearanceWeight = 'low' | 'medium' | 'high';

export type BannerStatus = 'published' | 'expired';

export interface Banner {
    id: string;
    portalId?: number;
    src: string;
    route: string;
    bannerRedirection: string;
    positionType: 'right' | 'top' | 'medium';
    pageType: 'home' | 'custom';
    position: number;
    /** Display probability weight (DB 1/2/3). Not used when expired. */
    appearanceWeight?: AppearanceWeight;
    bannerStatus: BannerStatus;
    /** YYYY-MM-DD */
    startsAt: string;
    /** YYYY-MM-DD */
    endsAt: string;
    /** When empty, UI and API use id as alt text */
    imageAlt?: string;
}

type PendingAddKind =
    | { type: 'home-top' }
    | { type: 'home-medium' }
    | { type: 'home-right' }
    | { type: 'custom-top'; sectionId: string }
    | { type: 'custom-medium'; sectionId: string }
    | { type: 'custom-right'; sectionId: string };

type PendingAddDetails = {
    src: string;
    bannerRedirection: string;
} | null;

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

    const [expiredBanners, setExpiredBanners] = useState<Banner[]>([]);

    const [bannerScheduleModalOpen, setBannerScheduleModalOpen] = useState(false);
    const [bannerScheduleModalMode, setBannerScheduleModalMode] = useState<'add' | 'edit'>('add');
    const [bannerScheduleDefaults, setBannerScheduleDefaults] = useState<{ start: string; end: string } | null>(null);
    const [pendingAddKind, setPendingAddKind] = useState<PendingAddKind | null>(null);
    const [pendingAddDetails, setPendingAddDetails] = useState<PendingAddDetails>(null);
    const [addBannerModalOpen, setAddBannerModalOpen] = useState(false);
    const [editScheduleBannerId, setEditScheduleBannerId] = useState<string | null>(null);

    // Modal states
    const [showAdSectionModal, setShowAdSectionModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditRouteModal, setShowEditRouteModal] = useState(false);
    const [showChangeImageModal, setShowChangeImageModal] = useState(false);
    const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
    const [editSectionId, setEditSectionId] = useState<string | null>(null);
    const [editSectionType, setEditSectionType] = useState<'top' | 'right' | 'medium'>('top');
    const [adSectionType, setAdSectionType] = useState<'top' | 'right' | 'medium'>('top');
    const [deleteBannerModalOpen, setDeleteBannerModalOpen] = useState(false);
    const [deleteBannerId, setDeleteBannerId] = useState<string | null>(null);
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
            ...customMediumSections.flatMap(s => s.banners),
            ...expiredBanners,
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

    const mapBannerFromApi = (b: Banner): Banner => {
        const id = b.id;
        const st = b.startsAt && b.startsAt.length >= 10 ? b.startsAt.slice(0, 10) : todayYmd();
        const en = b.endsAt && b.endsAt.length >= 10 ? b.endsAt.slice(0, 10) : addOneYearYmd(st);
        const alt = b.imageAlt && b.imageAlt.trim() !== '' ? b.imageAlt.trim() : id;
        const stat: BannerStatus = b.bannerStatus === 'expired' ? 'expired' : 'published';
        let aw = (b.appearanceWeight ?? 'medium') as AppearanceWeight | 'expired';
        if (stat === 'published' && aw === 'expired') {
            aw = 'medium';
        }
        return {
            ...b,
            src: normalizeBannerSrc(b.src),
            bannerRedirection: b.bannerRedirection ?? DEFAULT_BANNER_REDIRECTION,
            appearanceWeight: aw === 'expired' ? 'medium' : aw,
            bannerStatus: stat,
            startsAt: st,
            endsAt: en,
            imageAlt: alt,
        };
    };

    // Map flat banner list from API to UI state
    const applyBannersListToState = useCallback((list: Banner[]) => {
        if (!list || list.length === 0) {
            setExpiredBanners([]);
            setHomePageRightBanners([]);
            setHomePageTopBanners([]);
            setGeneralMediumBanners([]);
            setCustomTopSections([]);
            setCustomRightSections([]);
            setCustomMediumSections([]);
            return;
        }
        const mapped = list.map(mapBannerFromApi);
        const published = mapped.filter((b) => b.bannerStatus !== 'expired');
        const expired = mapped.filter((b) => b.bannerStatus === 'expired');
        setExpiredBanners(expired.sort((a, b) => b.endsAt.localeCompare(a.endsAt)));

        const homeRightBanners = published
            .filter((b) => b.pageType === 'home' && b.positionType === 'right')
            .sort((a, b) => a.position - b.position);
        setHomePageRightBanners(homeRightBanners);

        const homeTopBanners = published
            .filter((b) => b.pageType === 'home' && b.positionType === 'top')
            .sort((a, b) => a.position - b.position);
        setHomePageTopBanners(homeTopBanners);

        const generalMediumBannersList = published
            .filter((b) => b.pageType === 'home' && b.positionType === 'medium')
            .sort((a, b) => a.position - b.position);
        setGeneralMediumBanners(generalMediumBannersList);

        const customBanners = published.filter((b) => b.pageType === 'custom');
        const toSection = (route: string, banners: Banner[], prefix = 'section-') => ({
            id: `${prefix}${route.replace(/\//g, '-')}`,
            name: `Custom Page - ${route}`,
            route,
            banners: banners.sort((a, b) => a.position - b.position),
        });
        const groupByRoute = (positionType: 'right' | 'top' | 'medium') => {
            const byRoute = customBanners
                .filter((b) => b.positionType === positionType)
                .reduce(
                    (acc, b) => {
                        if (!acc[b.route]) acc[b.route] = [];
                        acc[b.route].push(b);
                        return acc;
                    },
                    {} as Record<string, Banner[]>
                );
            return Object.entries(byRoute).map(([route, banners]) =>
                toSection(route, banners, positionType === 'medium' ? 'section-medium-' : 'section-')
            );
        };
        setCustomRightSections(groupByRoute('right'));
        setCustomTopSections(groupByRoute('top'));
        setCustomMediumSections(groupByRoute('medium'));
    }, []);

    const reloadBanners = useCallback(() => {
        if (portalId == null) return;
        BannerService.getBannersByPortalId(portalId)
            .then((data) => {
                const list = Array.isArray(data) ? data : (data as { banners?: Banner[] })?.banners;
                if (list && list.length > 0) {
                    applyBannersListToState(list as Banner[]);
                } else {
                    applyBannersListToState([]);
                }
            })
            .catch((err) => {
                const status = (err as { status?: number })?.status;
                const msg = (err as { message?: string })?.message;
                const body = (err as { data?: unknown })?.data;
                console.error('Error loading banners from API:', { status, message: msg, data: body });
            });
    }, [portalId, applyBannersListToState]);

    // Reset banner state when portal changes; load banners for the selected portal only
    useEffect(() => {
        setHomePageRightBanners([]);
        setHomePageTopBanners([]);
        setGeneralMediumBanners([]);
        setCustomTopSections([]);
        setCustomRightSections([]);
        setCustomMediumSections([]);
        setExpiredBanners([]);
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

    const resolveSectionForBanner = useCallback(
        (banner: Banner): string => {
            if (banner.pageType === 'home') {
                if (banner.positionType === 'top') return 'home-top';
                if (banner.positionType === 'medium') return 'home-medium';
                return 'home';
            }
            const list =
                banner.positionType === 'top'
                    ? customTopSections
                    : banner.positionType === 'medium'
                      ? customMediumSections
                      : customRightSections;
            const sec = list.find((s) => s.route === banner.route);
            return sec?.id ?? `section-${banner.route.replace(/\//g, '-')}`;
        },
        [customTopSections, customMediumSections, customRightSections]
    );

    const handleBannerScheduleConfirm = (startsAt: string, endsAt: string) => {
        if (portalId == null) return;
        if (bannerScheduleModalMode === 'edit' && editScheduleBannerId) {
            BannerService.updateBanner(editScheduleBannerId, { startsAt, endsAt })
                .then(() => reloadBanners())
                .catch((err) => console.error('Error updating banner schedule:', getErrorDetails(err)));
            setBannerScheduleModalOpen(false);
            setEditScheduleBannerId(null);
            setPendingAddKind(null);
            setPendingAddDetails(null);
            return;
        }
        if (!pendingAddKind) return;

        const draftSrc = pendingAddDetails?.src?.trim() ? pendingAddDetails.src.trim() : DEFAULT_BANNER_IMAGE;
        const draftRedirection = pendingAddDetails?.bannerRedirection?.trim()
            ? pendingAddDetails.bannerRedirection.trim()
            : DEFAULT_BANNER_REDIRECTION;

        const runCreate = (newBanner: Banner) => {
            BannerService.createBanner({
                ...newBanner,
                portalId,
                startsAt,
                endsAt,
                imageAlt: newBanner.imageAlt ?? newBanner.id,
            })
                .then(() => reloadBanners())
                .catch((err) => console.error('Error persisting banner:', getErrorDetails(err)));
        };

        switch (pendingAddKind.type) {
            case 'home-top': {
                const id = generateBannerId('top', 'home');
                runCreate({
                    id,
                    src: draftSrc,
                    route: '/',
                    bannerRedirection: draftRedirection,
                    positionType: 'top',
                    pageType: 'home',
                    position: homePageTopBanners.length,
                    appearanceWeight: 'medium',
                    bannerStatus: 'published',
                    startsAt,
                    endsAt,
                    imageAlt: id,
                });
                break;
            }
            case 'home-medium': {
                const id = generateBannerId('medium', 'home');
                runCreate({
                    id,
                    src: draftSrc,
                    route: '/',
                    bannerRedirection: draftRedirection,
                    positionType: 'medium',
                    pageType: 'home',
                    position: generalMediumBanners.length,
                    appearanceWeight: 'medium',
                    bannerStatus: 'published',
                    startsAt,
                    endsAt,
                    imageAlt: id,
                });
                break;
            }
            case 'home-right': {
                const id = generateBannerId('right', 'home');
                runCreate({
                    id,
                    src: draftSrc,
                    route: '/',
                    bannerRedirection: draftRedirection,
                    positionType: 'right',
                    pageType: 'home',
                    position: homePageRightBanners.length,
                    appearanceWeight: 'medium',
                    bannerStatus: 'published',
                    startsAt,
                    endsAt,
                    imageAlt: id,
                });
                break;
            }
            case 'custom-top': {
                const sectionIndex = customTopSections.findIndex((s) => s.id === pendingAddKind.sectionId);
                if (sectionIndex === -1) break;
                const section = customTopSections[sectionIndex];
                const id = generateBannerId('top', 'custom');
                runCreate({
                    id,
                    src: draftSrc,
                    route: section.route,
                    bannerRedirection: draftRedirection,
                    positionType: 'top',
                    pageType: 'custom',
                    position: section.banners.length,
                    appearanceWeight: 'medium',
                    bannerStatus: 'published',
                    startsAt,
                    endsAt,
                    imageAlt: id,
                });
                break;
            }
            case 'custom-medium': {
                const sectionIndex = customMediumSections.findIndex((s) => s.id === pendingAddKind.sectionId);
                if (sectionIndex === -1) break;
                const section = customMediumSections[sectionIndex];
                const id = generateBannerId('medium', 'custom');
                runCreate({
                    id,
                    src: draftSrc,
                    route: section.route,
                    bannerRedirection: draftRedirection,
                    positionType: 'medium',
                    pageType: 'custom',
                    position: section.banners.length,
                    appearanceWeight: 'medium',
                    bannerStatus: 'published',
                    startsAt,
                    endsAt,
                    imageAlt: id,
                });
                break;
            }
            case 'custom-right': {
                const sectionIndex = customRightSections.findIndex((s) => s.id === pendingAddKind.sectionId);
                if (sectionIndex === -1) break;
                const section = customRightSections[sectionIndex];
                const id = generateBannerId('right', 'custom');
                runCreate({
                    id,
                    src: draftSrc,
                    route: section.route,
                    bannerRedirection: draftRedirection,
                    positionType: 'right',
                    pageType: 'custom',
                    position: section.banners.length,
                    appearanceWeight: 'medium',
                    bannerStatus: 'published',
                    startsAt,
                    endsAt,
                    imageAlt: id,
                });
                break;
            }
            default:
                break;
        }
        setBannerScheduleModalOpen(false);
        setPendingAddKind(null);
        setPendingAddDetails(null);
    };

    const openEditScheduleForBanner = (bannerId: string) => {
        const all = [
            ...homePageRightBanners,
            ...homePageTopBanners,
            ...generalMediumBanners,
            ...customTopSections.flatMap((s) => s.banners),
            ...customRightSections.flatMap((s) => s.banners),
            ...customMediumSections.flatMap((s) => s.banners),
            ...expiredBanners,
        ];
        const banner = all.find((b) => b.id === bannerId);
        if (!banner) return;
        setBannerScheduleModalMode('edit');
        setEditScheduleBannerId(bannerId);
        setPendingAddKind(null);
        setBannerScheduleDefaults({ start: banner.startsAt, end: banner.endsAt });
        setBannerScheduleModalOpen(true);
    };

    const beginAddBannerSchedule = (kind: PendingAddKind) => {
        const t = todayYmd();
        setBannerScheduleModalMode('add');
        setEditScheduleBannerId(null);
        setPendingAddKind(kind);
        setBannerScheduleDefaults({ start: t, end: addOneYearYmd(t) });
        setBannerScheduleModalOpen(true);
    };

    const beginAddBannerDetails = (kind: PendingAddKind) => {
        if (portalId == null) return;
        setPendingAddKind(kind);
        setPendingAddDetails(null);
        setAddBannerModalOpen(true);
    };

    const handleAddBannerDetailsCancel = () => {
        setAddBannerModalOpen(false);
        setPendingAddKind(null);
        setPendingAddDetails(null);
        setEditScheduleBannerId(null);
    };

    const handleAddBannerDetailsConfirm = (details: { src: string; bannerRedirection: string }) => {
        if (!pendingAddKind) return;
        setPendingAddDetails({ src: normalizeBannerSrc(details.src), bannerRedirection: details.bannerRedirection });
        setAddBannerModalOpen(false);
        beginAddBannerSchedule(pendingAddKind);
    };

    const handleAddHomePageTopBanner = () => {
        if (portalId == null) return;
        beginAddBannerDetails({ type: 'home-top' });
    };

    const handleAddGeneralMediumBanner = () => {
        if (portalId == null) return;
        beginAddBannerDetails({ type: 'home-medium' });
    };

    const handleAddHomePageRightBanner = () => {
        if (portalId == null) return;
        beginAddBannerDetails({ type: 'home-right' });
    };

    const handleAddCustomRightBanner = (sectionId: string) => {
        if (portalId == null) return;
        beginAddBannerDetails({ type: 'custom-right', sectionId });
    };

    const handleAddCustomTopBanner = (sectionId: string) => {
        if (portalId == null) return;
        beginAddBannerDetails({ type: 'custom-top', sectionId });
    };

    const handleChangeAppearanceWeight = (
        bannerId: string,
        _section: 'home-top' | 'home-medium' | 'home' | string,
        weight: AppearanceWeight
    ) => {
        BannerService.updateBanner(bannerId, { appearanceWeight: weight })
            .then(() => reloadBanners())
            .catch((err) => console.error('Error persisting appearance weight:', getErrorDetails(err)));
    };

    const openDeleteBannerModal = (bannerId: string) => {
        setDeleteBannerId(bannerId);
        setDeleteBannerModalOpen(true);
    };

    const cancelDeleteBanner = () => {
        setDeleteBannerModalOpen(false);
        setDeleteBannerId(null);
    };

    const confirmDeleteBanner = () => {
        if (!deleteBannerId) return;
        const id = deleteBannerId;
        setDeleteBannerModalOpen(false);
        setDeleteBannerId(null);
        BannerService.deleteBanner(id)
            .then(() => reloadBanners())
            .catch((err) => console.error('Error deleting banner:', getErrorDetails(err)));
    };

    const handleDeleteTopBanner = (bannerId: string, _section: 'home-top' | string) => {
        openDeleteBannerModal(bannerId);
    };

    const handleDeleteMediumBanner = (bannerId: string, _section: 'home-medium' | string) => {
        openDeleteBannerModal(bannerId);
    };

    const handleDeleteRightBanner = (bannerId: string, _section: 'home' | string) => {
        openDeleteBannerModal(bannerId);
    };

    const handleAddCustomMediumBanner = (sectionId: string) => {
        if (portalId == null) return;
        beginAddBannerDetails({ type: 'custom-medium', sectionId });
    };

    const handleAddCustomSection = (
        sectionName: string,
        sectionRoute: string,
        bannerSrc?: string,
        schedule?: { startsAt: string; endsAt: string }
    ) => {
        if (portalId == null) return;
        const routeSlug = sectionRoute.replace(/\//g, '-');

        if ((adSectionType === 'top' || adSectionType === 'medium') && bannerSrc && schedule) {
            const id = generateBannerId(adSectionType, 'custom');
            const newBanner: Banner = {
                id,
                src: bannerSrc,
                route: sectionRoute,
                bannerRedirection: DEFAULT_BANNER_REDIRECTION,
                positionType: adSectionType,
                pageType: 'custom',
                position: 0,
                appearanceWeight: 'medium',
                bannerStatus: 'published',
                startsAt: schedule.startsAt,
                endsAt: schedule.endsAt,
                imageAlt: id,
            };
            BannerService.createBanner({
                ...newBanner,
                portalId,
                startsAt: schedule.startsAt,
                endsAt: schedule.endsAt,
                imageAlt: id,
            })
                .then(() => reloadBanners())
                .catch((err) => console.error('Error persisting banner:', getErrorDetails(err)));
            setShowAdSectionModal(false);
            return;
        }

        const newSection: CustomSection = {
            id: adSectionType === 'medium' ? `section-medium-${routeSlug}-${Date.now()}` : `section-${routeSlug}-${Date.now()}`,
            name: sectionName,
            route: sectionRoute,
            banners: [],
        };

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
        Promise.all(bannerIds.map((id) => BannerService.deleteBanner(id)))
            .then(() => reloadBanners())
            .catch((err) => console.error('Error deleting banner:', getErrorDetails(err)));
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
            BannerService.updateBanner(b.id, { route: newRoute })
                .catch((err) => console.error('Error updating banner route:', getErrorDetails(err)))
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

        BannerService.updateBanner(changeImageBannerId, { src: newSrc, imageAlt: changeImageBannerId })
            .then(() => reloadBanners())
            .catch((err) => {
                console.error('Error persisting banner image:', getErrorDetails(err));
            });
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
        const expired = expiredBanners.find((b) => b.id === changeRedirectionBannerId);
        if (expired) return expired.bannerRedirection ?? '';

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
        BannerService.updateBanner(changeRedirectionBannerId, { bannerRedirection: newUrl })
            .then(() => reloadBanners())
            .catch((err) => console.error('Error persisting banner redirection:', getErrorDetails(err)));
        setShowChangeRedirectionModal(false);
        setChangeRedirectionBannerId(null);
        setChangeRedirectionBannerSection(null);
        setChangeRedirectionBannerType(null);
    };

    const handleBannerScheduleCancel = () => {
        setBannerScheduleModalOpen(false);
        setPendingAddKind(null);
        setEditScheduleBannerId(null);
        setPendingAddDetails(null);
    };

    const saveBannerScheduleInline = useCallback(
        async (bannerId: string, startsAt: string, endsAt: string) => {
            if (!bannerId) return;
            try {
                await BannerService.updateBanner(bannerId, { startsAt, endsAt });
                reloadBanners();
            } catch (error) {
                const { message } = getErrorDetails(error);
                alert(`Error saving schedule: ${message}`);
            }
        },
        [reloadBanners]
    );

    return {
        // State
        homePageRightBanners,
        homePageTopBanners,
        generalMediumBanners,
        customTopSections,
        customRightSections,
        customMediumSections,
        expiredBanners,
        addBannerModalOpen,
        bannerScheduleModalOpen,
        bannerScheduleModalMode,
        bannerScheduleDefaults,
        showAdSectionModal,
        showDeleteModal,
        showEditRouteModal,
        showChangeImageModal,
        showChangeRedirectionModal,
        deleteBannerModalOpen,
        deleteBannerId,
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
        confirmDeleteBanner,
        cancelDeleteBanner,
        handleAddBannerDetailsConfirm,
        handleAddBannerDetailsCancel,
        handleBannerScheduleConfirm,
        handleBannerScheduleCancel,
        openEditScheduleForBanner,
        saveBannerScheduleInline,
        resolveSectionForBanner,
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
