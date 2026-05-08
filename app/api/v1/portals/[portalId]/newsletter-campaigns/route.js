import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Database from "../../../../../../server/database/database.js";
import "../../../../../../server/database/models.js";

export const runtime = "nodejs";

export const GET = createEndpoint(async (_request, _body, ctx) => {
    // createEndpoint passes awaited context.params → { portalId }, not { params: { portalId } }
    const portalIdRaw = ctx?.portalId ?? ctx?.params?.portalId;
    const portalId = Number(portalIdRaw);
    if (!Number.isFinite(portalId)) {
        return NextResponse.json({ message: "portalId must be a number" }, { status: 400 });
    }

    const db = Database.getInstance();
    if (!db.isConfigured()) {
        return NextResponse.json({ message: "Database not configured" }, { status: 500 });
    }
    const sequelize = db.getSequelize();
    const pid = Math.trunc(portalId);

    const [rows] = await sequelize.query(
        `
        SELECT id, name
        FROM (
          SELECT DISTINCT
            c.newsletter_campaign_id AS id,
            c.newsletter_campaign_name AS name
          FROM newsletter_campaigns c
          WHERE c.portal_id = :portal_id
          UNION
          SELECT DISTINCT
            c.newsletter_campaign_id AS id,
            c.newsletter_campaign_name AS name
          FROM newsletter_campaign_portals cp
          INNER JOIN newsletter_campaigns c
            ON c.newsletter_campaign_id = cp.newsletter_campaign_id
          WHERE cp.portal_id = :portal_id
        ) merged
        ORDER BY name ASC
        `,
        { replacements: { portal_id: pid } }
    );

    return NextResponse.json(Array.isArray(rows) ? rows : []);
}, null, true);

