/**
 * POST — ensure the mediateca folder for this publication slot exists.
 * Returns folder id + path so uploads list under the correct folder.
 */

import { createEndpoint } from "../../../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { ensurePublicationSlotMediatecaFolderByIds } from "../../../../../../../../server/features/publication/PublicationMediatecaFolderService.js";
import "../../../../../../../../server/database/models.js";

export const runtime = "nodejs";

export const POST = createEndpoint(
    async (_request, _body, params) => {
        const publicationId = params?.id;
        const slotId = params?.slotId;
        if (!publicationId) {
            return NextResponse.json({ message: "Missing publication id" }, { status: 400 });
        }
        if (!slotId) {
            return NextResponse.json({ message: "Missing slot id" }, { status: 400 });
        }

        const { folderId, folderPath } = await ensurePublicationSlotMediatecaFolderByIds(
            String(publicationId),
            Number(slotId)
        );

        if (!folderId) {
            return NextResponse.json(
                { message: "Could not create or resolve mediateca folder for this slot" },
                { status: 404 }
            );
        }

        return NextResponse.json({ folderId, folderPath });
    },
    null,
    true
);
