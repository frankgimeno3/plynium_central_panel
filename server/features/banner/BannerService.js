import { QueryTypes } from "sequelize";
import BannerModel from "./BannerModel.js";
import "../../database/models.js";

const DEFAULT_REDIRECT = "https://www.vidrioperfil.com";

function weightDbToApi(n) {
    const v = Number(n);
    if (Number.isNaN(v)) return "medium";
    if (v === 0) return "expired";
    if (v === 1) return "low";
    if (v === 3) return "high";
    return "medium";
}

function weightApiToDb(api) {
    if (api === "low") return 1;
    if (api === "high") return 3;
    if (api === "medium") return 2;
    if (api === "expired") return 0;
    return 2;
}

function toYmd(d) {
    if (!d) return null;
    if (typeof d === "string") return d.slice(0, 10);
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return null;
    return x.toISOString().slice(0, 10);
}

function todayYmd() {
    return new Date().toISOString().slice(0, 10);
}

function addOneYearYmd(ymd) {
    const [y, m, day] = ymd.split("-").map((x) => parseInt(x, 10));
    const d = new Date(Date.UTC(y, m - 1, day));
    d.setUTCFullYear(d.getUTCFullYear() + 1);
    return d.toISOString().slice(0, 10);
}

function toApiFormat(row) {
    if (!row) return null;
    const r = row && typeof row.toJSON === "function" ? row.toJSON() : row;
    const id = r.bannerId ?? r.id_banner ?? r.banner_id;
    const w = r.bannerAppearenceWeight ?? r.banner_appearence_weight ?? 2;
    return {
        id,
        portalId: r.bannerPortalId ?? r.portal_id ?? r.banner_portal_id,
        src: r.bannerImageSrc ?? r.banner_image_src,
        route: r.bannerRoute ?? r.banner_route,
        bannerRedirection: r.bannerRedirectionUrl ?? r.banner_redirection_url ?? DEFAULT_REDIRECT,
        positionType: r.bannerPositionType ?? r.banner_position_type,
        pageType: r.bannerPageType ?? r.banner_page_type,
        position: r.bannerPosition ?? r.banner_position ?? 0,
        appearanceWeight: weightDbToApi(Number(w)),
        startsAt: toYmd(r.bannerStartsAt ?? r.banner_starting_date ?? r.banner_starts_at) ?? todayYmd(),
        endsAt: toYmd(r.bannerEndsAt ?? r.banner_ending_date ?? r.banner_ends_at) ?? addOneYearYmd(todayYmd()),
        status: r.bannerStatus ?? r.banner_status ?? "published",
        imageAlt: id,
    };
}

function assertValidDateRange(startsAtYmd, endsAtYmd) {
    if (!startsAtYmd || !endsAtYmd) {
        throw new Error("startsAt and endsAt are required (YYYY-MM-DD).");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startsAtYmd) || !/^\d{4}-\d{2}-\d{2}$/.test(endsAtYmd)) {
        throw new Error("startsAt/endsAt must be YYYY-MM-DD.");
    }
    if (endsAtYmd < startsAtYmd) {
        throw new Error("endsAt cannot be earlier than startsAt.");
    }
}

async function refreshBannerLifecycleForPortal(portalId) {
    const sequelize = BannerModel.sequelize;
    if (!sequelize) return;
    await sequelize.query(
        `
        UPDATE portal_banners
        SET banner_status = 'expired',
            banner_appearence_weight = 0
        WHERE portal_id = :portalId
          AND banner_ending_date < CURRENT_DATE
        `,
        { replacements: { portalId }, type: QueryTypes.UPDATE }
    );
    await sequelize.query(
        `
        UPDATE portal_banners
        SET banner_status = 'published'
        WHERE portal_id = :portalId
          AND banner_ending_date >= CURRENT_DATE
          AND banner_status != 'published'
        `,
        { replacements: { portalId }, type: QueryTypes.UPDATE }
    );
    await sequelize.query(
        `
        WITH ranked AS (
          SELECT id_banner,
            (ROW_NUMBER() OVER (
              PARTITION BY portal_id, banner_page_type, banner_route, banner_position_type
              ORDER BY banner_appearence_weight DESC, id_banner ASC
            ) - 1)::int AS new_pos
          FROM portal_banners
          WHERE portal_id = :portalId
            AND banner_status = 'published'
            AND banner_appearence_weight > 0
        )
        UPDATE portal_banners b
        SET banner_position = ranked.new_pos
        FROM ranked
        WHERE b.id_banner = ranked.id_banner
        `,
        { replacements: { portalId }, type: QueryTypes.UPDATE }
    );
}

export async function getBannersByPortalId(portalId) {
    try {
        await refreshBannerLifecycleForPortal(portalId);
        const rows = await BannerModel.findAll({
            where: { bannerPortalId: portalId },
            order: [
                ["bannerPageType", "ASC"],
                ["bannerPositionType", "ASC"],
                ["bannerRoute", "ASC"],
                ["bannerPosition", "ASC"],
            ],
        });
        return rows.map((r) => toApiFormat(r.toJSON()));
    } catch (error) {
        console.error("Error fetching banners from database:", error);
        throw error;
    }
}

export async function getAllBanners() {
    try {
        const rows = await BannerModel.findAll({
            order: [
                ["bannerPortalId", "ASC"],
                ["bannerPageType", "ASC"],
                ["bannerPositionType", "ASC"],
                ["bannerRoute", "ASC"],
                ["bannerPosition", "ASC"],
            ],
        });
        const portalIds = [...new Set(rows.map((r) => r.bannerPortalId).filter((x) => x != null))];
        for (const pid of portalIds) {
            await refreshBannerLifecycleForPortal(pid);
        }
        const refreshed = await BannerModel.findAll({
            order: [
                ["bannerPortalId", "ASC"],
                ["bannerPageType", "ASC"],
                ["bannerPositionType", "ASC"],
                ["bannerRoute", "ASC"],
                ["bannerPosition", "ASC"],
            ],
        });
        return refreshed.map((r) => toApiFormat(r.toJSON()));
    } catch (error) {
        console.error("Error fetching banners from database:", error);
        throw error;
    }
}

export async function getBannerById(id) {
    try {
        const row = await BannerModel.findByPk(id);
        if (!row) return null;
        if (row.bannerPortalId != null) {
            await refreshBannerLifecycleForPortal(row.bannerPortalId);
        }
        const again = await BannerModel.findByPk(id);
        if (!again) return null;
        return toApiFormat(again.toJSON());
    } catch (error) {
        console.error("Error fetching banner from database:", error);
        throw error;
    }
}

export async function createBanner(data) {
    try {
        const portalId = data.portalId;
        if (portalId == null || portalId === undefined) {
            throw new Error("portalId is required when creating a banner");
        }
        const startsAt = data.startsAt != null ? String(data.startsAt).slice(0, 10) : null;
        const endsAt = data.endsAt != null ? String(data.endsAt).slice(0, 10) : null;
        assertValidDateRange(startsAt, endsAt);
        const id = data.id;
        await BannerModel.create({
            bannerId: id,
            bannerPortalId: portalId,
            bannerImageSrc: data.src,
            bannerRoute: data.route ?? "/",
            bannerRedirectionUrl: data.bannerRedirection ?? DEFAULT_REDIRECT,
            bannerPositionType: data.positionType,
            bannerPageType: data.pageType,
            bannerPosition: data.position ?? 0,
            bannerAppearenceWeight: weightApiToDb(data.appearanceWeight ?? "medium"),
            bannerStartsAt: startsAt,
            bannerEndsAt: endsAt,
            bannerStatus: endsAt < todayYmd() ? "expired" : "published",
        });
        await refreshBannerLifecycleForPortal(portalId);
        const saved = await BannerModel.findByPk(id);
        return toApiFormat(saved.toJSON());
    } catch (error) {
        console.error("Error creating banner in database:", error);
        throw error;
    }
}

export async function updateBanner(id, data) {
    try {
        const row = await BannerModel.findByPk(id);
        if (!row) throw new Error(`Banner with id ${id} not found`);

        if (data.src !== undefined) row.bannerImageSrc = data.src;
        if (data.route !== undefined) row.bannerRoute = data.route;
        if (data.bannerRedirection !== undefined) row.bannerRedirectionUrl = data.bannerRedirection;
        if (data.appearanceWeight !== undefined && data.appearanceWeight !== "expired") {
            row.bannerAppearenceWeight = weightApiToDb(data.appearanceWeight);
        }
        if (data.startsAt !== undefined) {
            row.bannerStartsAt = String(data.startsAt).slice(0, 10);
        }
        if (data.endsAt !== undefined) {
            row.bannerEndsAt = String(data.endsAt).slice(0, 10);
        }

        const starts = toYmd(row.bannerStartsAt) ?? todayYmd();
        const ends = toYmd(row.bannerEndsAt) ?? addOneYearYmd(starts);
        assertValidDateRange(starts, ends);
        row.bannerStartsAt = starts;
        row.bannerEndsAt = ends;

        if (ends < todayYmd()) {
            row.bannerStatus = "expired";
            row.bannerAppearenceWeight = 0;
        } else {
            row.bannerStatus = "published";
            if (Number(row.bannerAppearenceWeight) === 0) {
                row.bannerAppearenceWeight = 2;
            }
        }

        await row.save();
        if (row.bannerPortalId != null) {
            await refreshBannerLifecycleForPortal(row.bannerPortalId);
        }
        const again = await BannerModel.findByPk(id);
        return toApiFormat(again.toJSON());
    } catch (error) {
        console.error("Error updating banner in database:", error);
        throw error;
    }
}

export async function deleteBanner(id) {
    try {
        const row = await BannerModel.findByPk(id);
        if (!row) throw new Error(`Banner with id ${id} not found`);
        const portalId = row.bannerPortalId;
        const snapshot = toApiFormat(row.toJSON());
        await row.destroy();
        if (portalId != null) {
            await refreshBannerLifecycleForPortal(portalId);
        }
        return snapshot;
    } catch (error) {
        console.error("Error deleting banner from database:", error);
        throw error;
    }
}

/** Update position for multiple banners (e.g. after reorder). */
export async function updateBannerPositions(updates) {
    try {
        for (const { id, position } of updates) {
            const row = await BannerModel.findByPk(id);
            if (row) {
                row.bannerPosition = position;
                await row.save();
            }
        }
        return await getAllBanners();
    } catch (error) {
        console.error("Error updating banner positions:", error);
        throw error;
    }
}
