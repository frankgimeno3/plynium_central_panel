import { createEndpoint } from "../../../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { rebuildAdvertiserIndexHtml } from "../../../../../../../../server/features/publication/PublicationAdvertiserIndexService.js";

export const runtime = "nodejs";

function toApiSlot(row) {
    const s = row && typeof row.get === "function" ? row.get({ plain: true }) : row;
    if (!s) return null;
    return {
        publication_slot_id: s.publication_slot_id,
        publication_id: s.publication_id ?? null,
        slot_content_type: s.slot_content_type ?? "",
        magazine_page_layout: s.magazine_page_layout ?? "",
        slot_updated_at: s.slot_updated_at ?? null,
    };
}

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

        try {
            const result = await rebuildAdvertiserIndexHtml(publicationId, Number(slotId));
            return NextResponse.json({
                index_slot: toApiSlot(result.index_slot),
                advert_count: result.advert_count,
                magazine_page_layout: result.magazine_page_layout,
                advert_rows: result.advert_rows,
            });
        } catch (e) {
            const status = e?.statusCode ?? 500;
            if (status >= 400 && status < 500) {
                return NextResponse.json({ message: e.message }, { status });
            }
            throw e;
        }
    },
    null,
    true
);
