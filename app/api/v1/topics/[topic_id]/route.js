import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getTopicById, updateTopicById } from "../../../../../server/features/topic_db/TopicDbService.js";
import Joi from "joi";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async (request, _body, routeParams) => {
    const topic_id = routeParams?.topic_id;
    if (topic_id == null || topic_id === "") {
      return NextResponse.json({ message: "topic_id is required" }, { status: 400 });
    }
    try {
      const url = new URL(request.url);
      const rawPortal = url.searchParams.get("portal_id");
      let portalId = null;
      if (rawPortal != null && rawPortal !== "") {
        const n = parseInt(rawPortal, 10);
        if (Number.isFinite(n)) portalId = n;
      }
      const topic = await getTopicById(topic_id, portalId != null ? { portalId } : {});
      return NextResponse.json(topic);
    } catch (err) {
      if (err.status === 404 || (err.message && err.message.includes("not found"))) {
        return NextResponse.json({ message: "Topic not found" }, { status: 404 });
      }
      if (err.status === 400) {
        return NextResponse.json({ message: err.message || "Bad request" }, { status: 400 });
      }
      throw err;
    }
  },
  null,
  true
);

const patchSchema = Joi.object({
  topic_name: Joi.string().min(1).max(255).optional(),
  topic_description: Joi.string().allow("").max(20000).optional(),
  // legacy: soportado sólo para compatibilidad (se mapea a topic_portal_ids)
  topic_portal: Joi.number().integer().min(0).optional(),
  topic_portal_ids: Joi.array().items(Joi.number().integer().min(0)).min(1).optional(),
}).min(1);

export const PATCH = createEndpoint(
  async (_request, body, routeParams) => {
    const topic_id = routeParams?.topic_id;
    if (topic_id == null || topic_id === "") {
      return NextResponse.json({ message: "topic_id is required" }, { status: 400 });
    }
    const updated = await updateTopicById(topic_id, body);
    return NextResponse.json(updated);
  },
  patchSchema,
  true
);
