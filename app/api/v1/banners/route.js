import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getAllBanners, createBanner } from "../../../../server/features/banner/BannerService.js";
import Joi from "joi";

export const runtime = "nodejs";

export const GET = createEndpoint(
    async () => {
        const banners = await getAllBanners();
        return NextResponse.json(banners);
    },
    null,
    true
);

export const POST = createEndpoint(
    async (request, body) => {
        const banner = await createBanner(body);
        return NextResponse.json(banner);
    },
    Joi.object({
        id: Joi.string().required(),
        src: Joi.string().uri().required(),
        route: Joi.string().optional().default("/"),
        bannerRedirection: Joi.string().uri().optional().default("https://www.vidrioperfil.com"),
        positionType: Joi.string().valid("right", "top", "medium").required(),
        pageType: Joi.string().valid("home", "custom").required(),
        position: Joi.number().integer().min(0).optional().default(0),
    }),
    true
);
