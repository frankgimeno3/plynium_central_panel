import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { createTopic, getTopics } from "../../../../server/features/topic_db/TopicDbService.js";
import Joi from "joi";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async (request) => {
    const url = new URL(request.url);
    const rawPortal = url.searchParams.get("portal_id");
    let portalId = null;
    if (rawPortal != null && rawPortal !== "") {
      const n = parseInt(rawPortal, 10);
      if (Number.isFinite(n)) portalId = n;
    }
    const list = await getTopics(portalId != null ? { portalId } : {});
    return NextResponse.json(list);
  },
  null,
  true
);

const postSchema = Joi.object({
  topic_name: Joi.string().min(1).max(255).required(),
  topic_description: Joi.string().allow("").max(20000).optional(),
  topic_portal_ids: Joi.array().items(Joi.number().integer().min(0)).min(1).required(),
});

export const POST = createEndpoint(
  async (_request, body) => {
    const created = await createTopic(body);
    return NextResponse.json(created);
  },
  postSchema,
  true
);
