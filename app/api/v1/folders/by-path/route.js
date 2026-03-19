import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getFolderByPath } from "../../../../../server/features/folder/FolderService.js";
import Joi from "joi";

export const runtime = "nodejs";

const getSchema = Joi.object({
    path: Joi.string().required().allow(""),
});

export const GET = createEndpoint(
    async (request, body) => {
        const path = body?.path ?? "";
        const folder = await getFolderByPath(path);
        if (!folder) {
            return NextResponse.json({ message: "Folder not found" }, { status: 404 });
        }
        return NextResponse.json(folder);
    },
    getSchema,
    true
);
