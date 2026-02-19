import {createEndpoint} from "../../../../server/createEndpoint.js";
import {NextResponse} from "next/server";
import {getAllArticles, createArticle} from "../../../../server/features/article/ArticleService.js";
import Joi from "joi";

// Ensure Node.js runtime (not Edge) for database connections
export const runtime = "nodejs";

export const GET = createEndpoint(async () => {
    const articles = await getAllArticles();
    return NextResponse.json(articles);
}, null, true);

export const POST = createEndpoint(async (request, body) => {
    const article = await createArticle(body);
    return NextResponse.json(article);
}, Joi.object({
    id_article: Joi.string().required(),
    articleTitle: Joi.string().required(),
    articleSubtitle: Joi.string().optional(),
    article_main_image_url: Joi.string().optional(),
    company: Joi.string().optional(),
    date: Joi.string().required(),
    article_tags_array: Joi.array().items(Joi.string()).optional(),
    contents_array: Joi.array().items(Joi.string()).optional(),
    highlited_position: Joi.string().allow("").optional(),
    is_article_event: Joi.boolean().optional(),
    event_id: Joi.string().allow("").optional()
}), true);

