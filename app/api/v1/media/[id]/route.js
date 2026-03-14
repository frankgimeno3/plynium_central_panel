import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getMediaById, deleteMedia } from "../../../../../server/features/media/MediaService.js";

export const runtime = "nodejs";

function getMediaIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/\/api\/v1\/media\/([^/]+)/);
    if (match && match[1]) {
        return decodeURIComponent(match[1]);
    }
    throw new Error("Media ID not found in URL");
}

export const GET = createEndpoint(
    async (request) => {
        const mediaId = getMediaIdFromRequest(request);
        const media = await getMediaById(mediaId);
        if (!media) {
            return NextResponse.json({ message: "Media not found" }, { status: 404 });
        }
        return NextResponse.json(media);
    },
    null,
    true
);

export const DELETE = createEndpoint(
    async (request) => {
        const mediaId = getMediaIdFromRequest(request);
        const result = await deleteMedia(mediaId);
        return NextResponse.json(result);
    },
    null,
    true
);
