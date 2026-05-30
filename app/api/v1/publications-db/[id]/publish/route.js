import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import {
    getPublicationPublishBlockers,
    publishPublication,
} from "../../../../../../server/features/publication/PublicationPublishService.js";

export const runtime = "nodejs";

function toApiPublication(row) {
    const p = row && typeof row.get === "function" ? row.get({ plain: true }) : row;
    if (!p) return null;
    return {
        publication_id: p.publication_id,
        magazine_id: p.magazine_id ?? null,
        publication_year: p.publication_year ?? null,
        publication_edition_name: p.publication_edition_name ?? "",
        magazine_general_issue_number: p.magazine_general_issue_number ?? null,
        magazine_this_year_issue: p.magazine_this_year_issue ?? null,
        publication_expected_publication_month: p.publication_expected_publication_month ?? null,
        real_publication_month_date: p.real_publication_month_date ?? null,
        publication_materials_deadline: p.publication_materials_deadline ?? null,
        is_special_edition: Boolean(p.is_special_edition),
        special_edition_subtitle: p.special_edition_subtitle ?? "",
        publication_theme: p.publication_theme ?? "",
        publication_status: p.publication_status ?? "draft",
        publication_format: p.publication_format ?? "flipbook",
        publication_main_image_url: p.publication_main_image_url ?? "",
        publication_cover_flatplan_image_url: p.publication_cover_flatplan_image_url ?? "",
        mediateca_folder_id: p.mediateca_folder_id ?? null,
        publication_header_domain: p.publication_header_domain ?? "",
        red_box_header: p.red_box_header ?? "",
        red_box_body: p.red_box_body ?? "",
        is_index_ready: Boolean(p.is_index_ready),
        is_summary_ready: Boolean(p.is_summary_ready),
    };
}

/** GET — list publish blockers without mutating (for modal pre-check). */
export const GET = createEndpoint(
    async (_request, _body, params) => {
        const id = params?.id;
        if (!id) return NextResponse.json({ message: "Missing publication id" }, { status: 400 });
        const { blockers, publication } = await getPublicationPublishBlockers(id);
        if (!publication) {
            return NextResponse.json({ message: "Publication not found" }, { status: 404 });
        }
        return NextResponse.json({
            can_publish: blockers.length === 0,
            blockers,
            publication: toApiPublication(publication),
        });
    },
    null,
    true
);

/** POST — publish the issue when all gates pass. */
export const POST = createEndpoint(
    async (_request, _body, params) => {
        const id = params?.id;
        if (!id) return NextResponse.json({ message: "Missing publication id" }, { status: 400 });
        try {
            const row = await publishPublication(id);
            return NextResponse.json({
                publication: toApiPublication(row),
                message: "Publication published.",
            });
        } catch (e) {
            const status = e?.statusCode ?? 500;
            if (status === 409) {
                return NextResponse.json(
                    { message: e.message, blockers: e.blockers ?? [e.message] },
                    { status: 409 }
                );
            }
            if (status === 404) {
                return NextResponse.json({ message: e.message }, { status: 404 });
            }
            throw e;
        }
    },
    null,
    true
);
