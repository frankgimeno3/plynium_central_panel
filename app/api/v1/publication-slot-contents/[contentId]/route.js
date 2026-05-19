/**
 * PATCH → update magazine page layout on a publication slot.
 * `contentId` is treated as `publication_slot_id` (legacy route name kept for clients).
 */

import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { PublicationSlotDbModel } from "../../../../../server/database/models.js";
import {
  readMagazinePageLayoutFromSlot,
  updateMagazinePageLayoutForSlotIds,
} from "../../../../../server/features/publication_workflow/PublicationArticleService.js";

export const runtime = "nodejs";

const patchSchema = Joi.object({
  magazine_page_layout: Joi.string().valid("2_col_article", "3_col_article").required(),
});

export const PATCH = createEndpoint(
  async (_request, body, params) => {
    const slotId = Number(params?.contentId);
    if (!Number.isInteger(slotId) || slotId <= 0) {
      return NextResponse.json({ message: "Invalid slot id" }, { status: 400 });
    }
    if (!PublicationSlotDbModel?.sequelize) {
      return NextResponse.json({ message: "Database not configured" }, { status: 500 });
    }

    const row = await PublicationSlotDbModel.findByPk(slotId);
    if (!row) {
      return NextResponse.json({ message: "Slot not found" }, { status: 404 });
    }

    await updateMagazinePageLayoutForSlotIds([slotId], body.magazine_page_layout);
    await row.reload();

    const layout = await readMagazinePageLayoutFromSlot(slotId);
    return NextResponse.json({
      publication_slot_id: slotId,
      publication_slot_content_id: slotId,
      magazine_page_layout: layout,
    });
  },
  patchSchema,
  true
);
