import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getFolders, createFolder } from "../../../../server/features/folder/FolderService.js";
import Joi from "joi";

export const runtime = "nodejs";

const getSchema = Joi.object({
    path: Joi.string().optional().allow(""),
});

export const GET = createEndpoint(
    async (request, body) => {
        const path = body?.path ?? "";
        const folders = await getFolders({ path });
        return NextResponse.json(folders);
    },
    getSchema,
    true
);

const postSchema = Joi.object({
    name: Joi.string().required(),
    path: Joi.string().optional().allow(""),
});

export const POST = createEndpoint(
    async (request, body) => {
        const folder = await createFolder(body);
        return NextResponse.json(folder);
    },
    postSchema,
    true
);
