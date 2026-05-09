import { createEndpoint } from "../../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { Op } from "sequelize";
import {
    PublicationPreferentialSlotDbModel,
    PublicationSlotDbModel,
} from "../../../../../../../server/database/models.js";
import "../../../../../../../server/database/models.js";

export const runtime = "nodejs";

/**
 * Positions where summary/index can live (preferential pages 2/4/6).
 * Page 8 is allowed by `slot_content_type` rules but the user requested only
 * 2, 4 and 6 as targets here.
 */
const ALLOWED_TARGET_POSITIONS = [
    "Preferential page 2",
    "Preferential page 4",
    "Preferential page 6",
];
const RESERVED_CONTENT_TYPES = new Set(["summary", "index"]);

const bodySchema = Joi.object({
    content_type: Joi.string().valid("summary", "index").required(),
    target_position: Joi.string()
        .valid(...ALLOWED_TARGET_POSITIONS)
        .required(),
});

function getPublicationIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(
        /\/api\/v1\/publications\/([^/]+)\/preferential-slots\/move-content-type/
    );
    if (match?.[1]) return decodeURIComponent(match[1]);
    throw new Error("publication id not found in URL");
}

/**
 * Swap `slot_content_type` between the publication_slots_db row that currently
 * holds `content_type` (summary / index) and the publication_slots_db row that
 * backs the preferential placement at `target_position`.
 *
 * If no slot currently holds `content_type` (legacy publication where summary
 * or index were never set), the target slot just gains the new content type.
 * If the target slot is the same one already holding `content_type`, this is a
 * no-op.
 */
export const POST = createEndpoint(
    async (request, body) => {
        const publicationId = getPublicationIdFromRequest(request);

        const sequelize = PublicationPreferentialSlotDbModel.sequelize;
        if (!sequelize) {
            return NextResponse.json(
                { message: "Database not initialized" },
                { status: 500 }
            );
        }

        const result = await sequelize.transaction(async (transaction) => {
            const prefRows = await PublicationPreferentialSlotDbModel.findAll({
                where: { publication_id: publicationId },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!prefRows.length) {
                return {
                    status: 404,
                    payload: {
                        message:
                            "This publication has no preferential placements; cannot move summary/index.",
                    },
                };
            }

            const slotIds = prefRows
                .map((r) => r.get("publication_slot_id"))
                .filter((v) => v != null)
                .map((v) => Number(v))
                .filter((n) => Number.isFinite(n));
            const slotRows = slotIds.length
                ? await PublicationSlotDbModel.findAll({
                      where: { publication_slot_id: { [Op.in]: slotIds } },
                      transaction,
                      lock: transaction.LOCK.UPDATE,
                  })
                : [];
            const slotById = new Map(
                slotRows.map((s) => [Number(s.get("publication_slot_id")), s])
            );

            const targetPref = prefRows.find(
                (r) =>
                    String(r.get("position_in_magazine") ?? "").trim() ===
                    body.target_position
            );
            if (!targetPref) {
                return {
                    status: 404,
                    payload: {
                        message: `Preferential placement for '${body.target_position}' not found on this publication.`,
                    },
                };
            }
            const targetSlotId = Number(targetPref.get("publication_slot_id"));
            const targetSlot = Number.isFinite(targetSlotId)
                ? slotById.get(targetSlotId)
                : null;
            if (!targetSlot) {
                return {
                    status: 404,
                    payload: {
                        message: `publication_slots_db row for '${body.target_position}' not found.`,
                    },
                };
            }

            let sourcePref = null;
            let sourceSlot = null;
            for (const r of prefRows) {
                const sid = Number(r.get("publication_slot_id"));
                if (!Number.isFinite(sid)) continue;
                const slot = slotById.get(sid);
                if (!slot) continue;
                const ct = String(slot.get("slot_content_type") ?? "")
                    .trim()
                    .toLowerCase();
                if (ct === body.content_type) {
                    sourcePref = r;
                    sourceSlot = slot;
                    break;
                }
            }

            const targetType = String(
                targetSlot.get("slot_content_type") ?? ""
            )
                .trim()
                .toLowerCase();

            if (
                sourceSlot &&
                Number(sourceSlot.get("publication_slot_id")) ===
                    Number(targetSlot.get("publication_slot_id"))
            ) {
                return {
                    status: 200,
                    payload: {
                        ok: true,
                        swapped: false,
                        message: "Already at the requested position; nothing to do.",
                    },
                };
            }

            const previousSourceType = sourceSlot
                ? String(sourceSlot.get("slot_content_type") ?? "")
                      .trim()
                      .toLowerCase()
                : null;

            // Demote the source: take whatever the target had before. Adverts
            // and articles fall back to "advert".
            if (sourceSlot) {
                const demotedType = RESERVED_CONTENT_TYPES.has(targetType)
                    ? targetType
                    : "advert";
                await sourceSlot.update(
                    { slot_content_type: demotedType },
                    { transaction }
                );
            }

            await targetSlot.update(
                { slot_content_type: body.content_type },
                { transaction }
            );

            return {
                status: 200,
                payload: {
                    ok: true,
                    swapped: true,
                    moved_content_type: body.content_type,
                    target_position: body.target_position,
                    target_publication_slot_id: Number(
                        targetSlot.get("publication_slot_id")
                    ),
                    target_previous_content_type: targetType || null,
                    source_position: sourcePref
                        ? String(
                              sourcePref.get("position_in_magazine") ?? ""
                          )
                        : null,
                    source_publication_slot_id: sourceSlot
                        ? Number(sourceSlot.get("publication_slot_id"))
                        : null,
                    source_previous_content_type: previousSourceType,
                },
            };
        });

        return NextResponse.json(result.payload, { status: result.status });
    },
    bodySchema,
    true
);
