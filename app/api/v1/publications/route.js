import {createEndpoint} from "../../../../server/createEndpoint.js";
import {NextResponse} from "next/server";
import {getAllPublications, createPublication} from "../../../../server/features/publication/PublicationService.js";
import Joi from "joi";

// Ensure Node.js runtime (not Edge) for database connections
export const runtime = "nodejs";

export const GET = createEndpoint(async () => {
    const publications = await getAllPublications();
    return NextResponse.json(publications);
}, null, true);

export const POST = createEndpoint(async (request, body) => {
    const publication = await createPublication(body);
    return NextResponse.json(publication);
}, Joi.object({
    id_publication: Joi.string().required(),
    redirectionLink: Joi.string().required(),
    date: Joi.string().required(),
    magazine: Joi.string().required(),
    número: Joi.number().required(),
    publication_main_image_url: Joi.string().optional().allow("")
}), true);

