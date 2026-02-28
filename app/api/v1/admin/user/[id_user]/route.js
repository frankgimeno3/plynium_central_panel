import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getUserByIdFromRds } from "../../../../../../server/features/user/userRepository.js";

function getIdUserFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/\/api\/v1\/admin\/user\/([^/]+)/);
    if (match && match[1]) {
        return decodeURIComponent(match[1]);
    }
    return null;
}

export const GET = createEndpoint(async (request) => {
    const id_user = getIdUserFromRequest(request);
    if (!id_user) {
        return NextResponse.json({ error: "id_user required" }, { status: 400 });
    }
    const user = await getUserByIdFromRds(id_user);
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
}, null, true, []);
