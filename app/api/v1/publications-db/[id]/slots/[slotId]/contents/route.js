import { createEndpoint } from "../../../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { PublicationSlotContentDbModel } from "../../../../../../../../server/database/models.js";
import "../../../../../../../../server/database/models.js";

export const runtime = "nodejs";

function toPlain(row) {
  return row && typeof row.get === "function" ? row.get({ plain: true }) : row;
}

function toApiSlotContent(row) {
  const c = toPlain(row);
  if (!c) return null;
  return {
    publication_slot_content_id: c.publication_slot_content_id,
    publication_id: c.publication_id,
    publication_slot_id: c.publication_slot_id,
    publication_slot_position: c.publication_slot_position ?? 0,
    slot_content_format: c.slot_content_format ?? "",
    slot_content_object_array: c.slot_content_object_array ?? [],
  };
}

export const GET = createEndpoint(
  async (_request, _body, params) => {
    const publicationId = params?.id;
    const slotId = params?.slotId;
    if (!publicationId) return NextResponse.json({ message: "Missing publication id" }, { status: 400 });
    if (!slotId) return NextResponse.json({ message: "Missing slot id" }, { status: 400 });

    if (!PublicationSlotContentDbModel?.sequelize) return NextResponse.json([]);

    const rows = await PublicationSlotContentDbModel.findAll({
      where: {
        publication_id: String(publicationId),
        publication_slot_id: Number(slotId),
      },
      order: [["publication_slot_position", "ASC"]],
    });

    return NextResponse.json(rows.map(toApiSlotContent).filter(Boolean));
  },
  null,
  true
);

