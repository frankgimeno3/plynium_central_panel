import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { updateFolder, deleteFolder } from "../../../../../server/features/folder/FolderService.js";
import Joi from "joi";

export const runtime = "nodejs";

function getFolderIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/\/api\/v1\/folders\/([^/]+)/);
    if (match && match[1]) {
        return decodeURIComponent(match[1]);
    }
    throw new Error("Folder ID not found in URL");
}

const patchSchema = Joi.object({
    name: Joi.string().required().trim(),
});

export const PATCH = createEndpoint(
    async (request, body) => {
        const folderId = getFolderIdFromRequest(request);
        const folder = await updateFolder(folderId, { name: body.name });
        return NextResponse.json(folder);
    },
    patchSchema,
    true
);

export const DELETE = createEndpoint(
    async (request) => {
        const folderId = getFolderIdFromRequest(request);
        const result = await deleteFolder(folderId);
        return NextResponse.json(result);
    },
    null,
    true
);
