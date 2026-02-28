import {createEndpoint} from "../../../../server/createEndpoint.js";
import {NextResponse} from "next/server";
import {getAllPublications, createPublication} from "../../../../server/features/publication/PublicationService.js";
import Joi from "joi";

// Ensure Node.js runtime (not Edge) for database connections
export const runtime = "nodejs";

const getSchema = Joi.object({
    portalNames: Joi.string().optional(),
});

export const GET = createEndpoint(async (request, body) => {
    const portalNames = body?.portalNames
        ? String(body.portalNames).split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    const publications = await getAllPublications({ portalNames });
    return NextResponse.json(publications);
}, getSchema, true);

export const POST = createEndpoint(async (request, body) => {
    const publication = await createPublication(body);
    return NextResponse.json(publication);
}, Joi.object({
    id_publication: Joi.string().required(),
    redirectionLink: Joi.string().required(),
    date: Joi.string().required(),
    magazine: Joi.string().required(),
    número: Joi.number().required(),
    publication_main_image_url: Joi.string().optional().allow(""),
    portalIds: Joi.array().items(Joi.number().integer().min(1)).optional(),
}), true);

