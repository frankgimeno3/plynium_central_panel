import BannerModel from "./BannerModel.js";
import "../../database/models.js";

function toApiFormat(row) {
    if (!row) return null;
    const r = row && typeof row.toJSON === "function" ? row.toJSON() : row;
    return {
        id: r.id,
        src: r.src,
        route: r.route,
        bannerRedirection: r.banner_redirection ?? "https://www.vidrioperfil.com",
        positionType: r.position_type,
        pageType: r.page_type,
        position: r.position,
    };
}

export async function getAllBanners() {
    try {
        const rows = await BannerModel.findAll({
            order: [
                ["page_type", "ASC"],
                ["position_type", "ASC"],
                ["route", "ASC"],
                ["position", "ASC"],
            ],
        });
        return rows.map((r) => toApiFormat(r.toJSON()));
    } catch (error) {
        console.error("Error fetching banners from database:", error);
        throw error;
    }
}

export async function getBannerById(id) {
    try {
        const row = await BannerModel.findByPk(id);
        if (!row) return null;
        return toApiFormat(row.toJSON());
    } catch (error) {
        console.error("Error fetching banner from database:", error);
        throw error;
    }
}

export async function createBanner(data) {
    try {
        const row = await BannerModel.create({
            id: data.id,
            src: data.src,
            route: data.route ?? "/",
            banner_redirection: data.bannerRedirection ?? "https://www.vidrioperfil.com",
            position_type: data.positionType,
            page_type: data.pageType,
            position: data.position ?? 0,
        });
        return toApiFormat(row.toJSON());
    } catch (error) {
        console.error("Error creating banner in database:", error);
        throw error;
    }
}

export async function updateBanner(id, data) {
    try {
        const row = await BannerModel.findByPk(id);
        if (!row) throw new Error(`Banner with id ${id} not found`);

        if (data.src !== undefined) row.src = data.src;
        if (data.route !== undefined) row.route = data.route;
        if (data.bannerRedirection !== undefined) row.banner_redirection = data.bannerRedirection;
        if (data.position !== undefined) row.position = data.position;

        await row.save();
        return toApiFormat(row.toJSON());
    } catch (error) {
        console.error("Error updating banner in database:", error);
        throw error;
    }
}

export async function deleteBanner(id) {
    try {
        const row = await BannerModel.findByPk(id);
        if (!row) throw new Error(`Banner with id ${id} not found`);
        await row.destroy();
        return toApiFormat(row.toJSON());
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
                row.position = position;
                await row.save();
            }
        }
        return await getAllBanners();
    } catch (error) {
        console.error("Error updating banner positions:", error);
        throw error;
    }
}
