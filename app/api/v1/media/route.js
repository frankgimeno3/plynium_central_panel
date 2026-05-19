import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getMedia, createMedia } from "../../../../server/features/media/MediaService.js";
import Joi from "joi";

export const runtime = "nodejs";

const getSchema = Joi.object({
    folderPath: Joi.string().optional().allow(""),
    folderId: Joi.string().uuid().optional(),
    search: Joi.string().optional().allow(""),
});

export const GET = createEndpoint(
    async (request, body) => {
        const folderPath = body?.folderPath ?? "";
        const folderId = body?.folderId ?? "";
        const search = body?.search ?? "";
        const items = await getMedia({ folderPath, folderId, search });
        return NextResponse.json(items);
    },
    getSchema,
    true
);

const postSchema = Joi.object({
    mediaId: Joi.string().uuid().required(),
    name: Joi.string().optional(),
    contentName: Joi.string().optional(),
    s3Key: Joi.string().required(),
    folderPath: Joi.string().optional().allow(""),
    folderId: Joi.string().uuid().optional(),
    publicationId: Joi.string().optional(),
    slotId: Joi.number().integer().positive().optional(),
    cdnUrl: Joi.string().optional().allow(""),
    contentType: Joi.string().optional().allow(""),
    type: Joi.string().valid("pdf", "image").optional(),
}).or("name", "contentName");

export const POST = createEndpoint(
    async (request, body) => {
        const media = await createMedia(body);
        return NextResponse.json(media);
    },
    postSchema,
    true
);
