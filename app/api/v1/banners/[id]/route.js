import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import {
    getBannerById,
    updateBanner,
    deleteBanner,
} from "../../../../../server/features/banner/BannerService.js";
import Joi from "joi";

function getIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/\/api\/v1\/banners\/([^/]+)/);
    if (match && match[1]) {
        return decodeURIComponent(match[1]);
    }
    throw new Error("Banner ID not found in URL");
}

export const GET = createEndpoint(
    async (request) => {
        const id = getIdFromRequest(request);
        const banner = await getBannerById(id);
        if (!banner) {
            return NextResponse.json({ error: "Banner not found" }, { status: 404 });
        }
        return NextResponse.json(banner);
    },
    null,
    true
);

export const PUT = createEndpoint(
    async (request, body) => {
        const id = getIdFromRequest(request);
        const banner = await updateBanner(id, body);
        return NextResponse.json(banner);
    },
    Joi.object({
        src: Joi.string().uri().optional(),
        route: Joi.string().optional(),
        bannerRedirection: Joi.string().uri().optional(),
        position: Joi.number().integer().min(0).optional(),
        appearanceWeight: Joi.string().valid("low", "medium", "high").optional(),
    }),
    true
);

export const DELETE = createEndpoint(
    async (request) => {
        const id = getIdFromRequest(request);
        await deleteBanner(id);
        return NextResponse.json({ ok: true });
    },
    null,
    true
);
