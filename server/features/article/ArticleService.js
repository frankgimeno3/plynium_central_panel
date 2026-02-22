import { Op } from "sequelize";
import ArticleModel from "./ArticleModel.js";
import { createArticlePublications } from "./ArticlePublicationService.js";
// Ensure models are initialized by importing models.js
import "../../database/models.js";

const ARTICLE_ATTRIBUTES_WITHOUT_HIGHLITED = [
    'id_article', 'article_title', 'article_subtitle', 'article_main_image_url',
    'company', 'date', 'is_article_event', 'event_id', 'created_at', 'updated_at'
];

function isHighlitedPositionMissingError(error) {
    const msg = (error?.message || "") + (error?.original?.message || "");
    return msg.includes("highlited_position") && msg.includes("does not exist");
}

function isArticleEventColumnsMissingError(error) {
    const msg = (error?.message || "") + (error?.original?.message || "");
    return (msg.includes("is_article_event") || msg.includes("event_id")) && msg.includes("does not exist");
}

async function ensureArticleEventColumns() {
    if (!ArticleModel.sequelize) return;
    const tableName = ArticleModel.tableName || "articles";
    await ArticleModel.sequelize.query(
        `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS is_article_event BOOLEAN NOT NULL DEFAULT false`
    );
    await ArticleModel.sequelize.query(
        `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS event_id VARCHAR(255) DEFAULT ''`
    );
}

/** Format a string array as PostgreSQL array literal for text[] columns */
function toPostgresArrayLiteral(arr) {
    if (!Array.isArray(arr)) return "{}";
    const escaped = arr.map((s) => {
        const str = String(s);
        return '"' + str.replace(/\\/g, "\\\\").replace(/"/g, '""') + '"';
    });
    return "{" + escaped.join(",") + "}";
}

function toApiArticle(article) {
    return {
        id_article: article.id_article,
        articleTitle: article.article_title,
        articleSubtitle: article.article_subtitle,
        article_main_image_url: article.article_main_image_url,
        company: article.company,
        date: article.date ? new Date(article.date).toISOString().split('T')[0] : null,
        article_tags_array: [],
        contents_array: [],
        highlited_position: article.highlited_position ?? "",
        is_article_event: article.is_article_event === true,
        event_id: article.event_id ?? ""
    };
}

/**
 * @param {{ portalNames?: string[] }} opts - If portalNames is a non-empty array, only articles published in at least one of those portals (by name) are returned.
 */
export async function getAllArticles(opts = {}) {
    const portalNames = Array.isArray(opts?.portalNames) ? opts.portalNames.filter(Boolean).map((n) => String(n).trim()) : [];
    try {
        if (!ArticleModel.sequelize) {
            console.warn('ArticleModel not initialized, returning empty array');
            return [];
        }

        if (portalNames.length > 0) {
            const placeholders = portalNames.map((_, i) => `:p${i}`).join(", ");
            const replacements = Object.fromEntries(portalNames.map((n, i) => [`p${i}`, n]));
            const [rows] = await ArticleModel.sequelize.query(
                `SELECT DISTINCT a.id_article, a.article_title, a.article_subtitle, a.article_main_image_url,
                        a.company, a.date, a.highlited_position, a.is_article_event, a.event_id, a.created_at, a.updated_at
                 FROM articles a
                 INNER JOIN article_publications ap ON ap.article_id = a.id_article
                 INNER JOIN portals p ON p.id = ap.portal_id
                 WHERE p.name IN (${placeholders})
                 ORDER BY a.date DESC`,
                { replacements }
            );
            return (rows || []).map((row) => toApiArticle(row));
        }

        const articles = await ArticleModel.findAll({
            order: [['date', 'DESC']]
        });
        return articles.map(toApiArticle);
    } catch (error) {
        if (isArticleEventColumnsMissingError(error)) {
            console.warn('[ArticleService] Columns is_article_event/event_id missing, adding them...');
            try {
                await ensureArticleEventColumns();
                return getAllArticles(opts);
            } catch (retryError) {
                console.error('Error in getAllArticles after adding columns:', retryError);
                throw retryError;
            }
        }
        if (isHighlitedPositionMissingError(error)) {
            try {
                const articles = await ArticleModel.findAll({
                    attributes: ARTICLE_ATTRIBUTES_WITHOUT_HIGHLITED,
                    order: [['date', 'DESC']]
                });
                return articles.map(article => ({ ...toApiArticle(article), highlited_position: "" }));
            } catch (fallbackError) {
                console.error('Error in getAllArticles fallback:', fallbackError);
            }
        }
        console.error('Error fetching articles from database:', error);
        if (error.name === 'SequelizeConnectionError' ||
            error.name === 'SequelizeConnectionRefusedError' ||
            error.message?.includes('ETIMEDOUT') ||
            error.message?.includes('ECONNREFUSED') ||
            (error.message?.includes('relation') && error.message?.includes('does not exist')) ||
            error.message?.includes('not initialized') ||
            error.message?.includes('Model not found')) {
            console.warn('Database connection issue, returning empty array');
            return [];
        }
        throw error;
    }
}

export async function getArticleById(idArticle) {
    try {
        const article = await ArticleModel.findByPk(idArticle);
        if (!article) {
            throw new Error(`Article with id ${idArticle} not found`);
        }
        return toApiArticle(article);
    } catch (error) {
        if (isArticleEventColumnsMissingError(error)) {
            try {
                await ensureArticleEventColumns();
                const article = await ArticleModel.findByPk(idArticle);
                if (!article) throw new Error(`Article with id ${idArticle} not found`);
                return toApiArticle(article);
            } catch (retryError) {
                if (retryError.message?.includes('not found')) throw retryError;
                throw retryError;
            }
        }
        if (isHighlitedPositionMissingError(error)) {
            try {
                const article = await ArticleModel.findByPk(idArticle, {
                    attributes: ARTICLE_ATTRIBUTES_WITHOUT_HIGHLITED
                });
                if (!article) throw new Error(`Article with id ${idArticle} not found`);
                return { ...toApiArticle(article), highlited_position: "" };
            } catch (fallbackError) {
                if (fallbackError.message?.includes('not found')) throw fallbackError;
                console.error('Error in getArticleById fallback:', fallbackError);
            }
        }
        console.error('Error fetching article from database:', error);
        throw error;
    }
}

function buildCreatePayload(articleData, includeHighlitedPosition = true) {
    const base = {
        id_article: articleData.id_article,
        article_title: articleData.articleTitle,
        article_subtitle: articleData.articleSubtitle,
        article_main_image_url: articleData.article_main_image_url,
        company: articleData.company,
        date: articleData.date,
        is_article_event: articleData.is_article_event === true,
        event_id: (articleData.is_article_event === true && articleData.event_id) ? String(articleData.event_id).trim() : ""
    };
    if (includeHighlitedPosition) {
        base.highlited_position = (articleData.highlited_position || "").trim() || "";
    }
    return base;
}

export async function createArticle(articleData) {
    const requestId = `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[ArticleService] [${requestId}] Starting createArticle`);
    
    try {
        if (!ArticleModel.sequelize) {
            console.error(`[ArticleService] [${requestId}] ArticleModel not initialized`);
            throw new Error('ArticleModel not initialized');
        }

        const dbConfig = ArticleModel.sequelize.config;
        console.log(`[ArticleService] [${requestId}] Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
        console.log(`[ArticleService] [${requestId}] Creating article with data:`, JSON.stringify(articleData, null, 2));

        const highlitedPosition = (articleData.highlited_position || "").trim();
        if (highlitedPosition) {
            try {
                await ArticleModel.update(
                    { highlited_position: "" },
                    { where: { highlited_position: highlitedPosition } }
                );
            } catch (updateErr) {
                if (!updateErr.message?.includes('highlited_position') && !updateErr.message?.includes('does not exist')) {
                    throw updateErr;
                }
            }
        }

        const article = await ArticleModel.create(buildCreatePayload(articleData, true));
        const portalIds = Array.isArray(articleData.portalIds) ? articleData.portalIds.filter((id) => Number.isInteger(Number(id))) : [];
        if (portalIds.length > 0) {
            await createArticlePublications(article.id_article, portalIds.map(Number), articleData.articleTitle);
        }
        console.log(`[ArticleService] [${requestId}] Article created successfully:`, article.toJSON());
        return toApiArticle(article);
    } catch (error) {
        if (isArticleEventColumnsMissingError(error)) {
            console.warn(`[ArticleService] [${requestId}] Columns is_article_event/event_id missing, adding them...`);
            try {
                await ensureArticleEventColumns();
                const article = await ArticleModel.create(buildCreatePayload(articleData, true));
                const portalIds = Array.isArray(articleData.portalIds) ? articleData.portalIds.filter((id) => Number.isInteger(Number(id))) : [];
                if (portalIds.length > 0) {
                    await createArticlePublications(article.id_article, portalIds.map(Number), articleData.articleTitle);
                }
                return toApiArticle(article);
            } catch (retryError) {
                console.error(`[ArticleService] [${requestId}] Create failed after adding columns:`, retryError);
                throw retryError;
            }
        }
        if (isHighlitedPositionMissingError(error)) {
            try {
                const payload = buildCreatePayload(articleData, false);
                const tableName = ArticleModel.tableName || "articles";
                await ArticleModel.sequelize.query(
                    `INSERT INTO "${tableName}" (id_article, article_title, article_subtitle, article_main_image_url, company, date, created_at, updated_at, is_article_event, event_id)
                     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8)`,
                    {
                        bind: [
                            payload.id_article,
                            payload.article_title,
                            payload.article_subtitle || null,
                            payload.article_main_image_url || null,
                            payload.company || null,
                            payload.date,
                            payload.is_article_event ?? false,
                            payload.event_id ?? ""
                        ]
                    }
                );
                const article = await ArticleModel.findByPk(payload.id_article, {
                    attributes: ARTICLE_ATTRIBUTES_WITHOUT_HIGHLITED
                });
                if (!article) throw new Error("Article not found after insert");
                const portalIds = Array.isArray(articleData.portalIds) ? articleData.portalIds.filter((id) => Number.isInteger(Number(id))) : [];
                if (portalIds.length > 0) {
                    await createArticlePublications(payload.id_article, portalIds.map(Number), articleData.articleTitle);
                }
                console.log(`[ArticleService] [${requestId}] Article created (without highlited_position):`, article.toJSON());
                return { ...toApiArticle(article), highlited_position: "" };
            } catch (fallbackError) {
                console.error(`[ArticleService] [${requestId}] Fallback create failed:`, fallbackError);
                throw fallbackError;
            }
        }
        console.error(`[ArticleService] [${requestId}] Error creating article in database`);
        console.error(`[ArticleService] [${requestId}] Error name:`, error.name);
        console.error(`[ArticleService] [${requestId}] Error message:`, error.message);
        if (error.name === 'SequelizeConnectionError' || error.message?.includes('ETIMEDOUT')) {
            const dbConfig = ArticleModel.sequelize?.config;
            if (dbConfig) {
                console.error(`[ArticleService] [${requestId}] Attempted connection to: ${dbConfig.host}:${dbConfig.port}`);
            }
        }
        if (error.name === 'SequelizeConnectionError' ||
            error.name === 'SequelizeConnectionRefusedError' ||
            error.message?.includes('ETIMEDOUT') ||
            error.message?.includes('ECONNREFUSED')) {
            const errorMsg = error.message || '';
            let helpfulMsg = `Database connection error: ${errorMsg}`;
            if (errorMsg.includes('ETIMEDOUT') || errorMsg.includes('ECONNREFUSED')) {
                helpfulMsg += '\n\nPossible solutions:\n';
                helpfulMsg += '1. Check if your IP is allowed in RDS Security Group\n';
                helpfulMsg += '2. Verify DATABASE_HOST, DATABASE_PORT in .env file\n';
                helpfulMsg += '3. Ensure RDS instance is running and publicly accessible\n';
                helpfulMsg += '4. Check your network/firewall settings\n';
                helpfulMsg += '5. Consider using SSH tunnel for secure connection';
            }
            throw new Error(helpfulMsg);
        }
        throw error;
    }
}

/** Build DB update payload; use empty string for highlited_position when undefined/null so DB never gets null. */
function buildUpdatePayload(article, articleData, includeHighlitedPosition = true) {
    const payload = {};
    if (articleData.articleTitle !== undefined) payload.article_title = articleData.articleTitle;
    if (articleData.articleSubtitle !== undefined) payload.article_subtitle = articleData.articleSubtitle;
    if (articleData.article_main_image_url !== undefined) payload.article_main_image_url = articleData.article_main_image_url;
    if (articleData.company !== undefined) payload.company = articleData.company;
    if (articleData.date !== undefined) payload.date = articleData.date;
    if (includeHighlitedPosition && articleData.highlited_position !== undefined) {
        const v = (articleData.highlited_position || "").trim();
        payload.highlited_position = v;
    }
    if (articleData.is_article_event !== undefined) {
        payload.is_article_event = articleData.is_article_event === true;
        if (!payload.is_article_event) payload.event_id = "";
    }
    if (articleData.event_id !== undefined) payload.event_id = (articleData.event_id || "").trim();
    return payload;
}

export async function updateArticle(idArticle, articleData) {
    try {
        let article = await ArticleModel.findByPk(idArticle);
        if (!article) {
            throw new Error(`Article with id ${idArticle} not found`);
        }
        if (articleData.highlited_position !== undefined) {
            const newHighlitedPosition = (articleData.highlited_position || "").trim();
            if (newHighlitedPosition) {
                try {
                    await ArticleModel.update(
                        { highlited_position: "" },
                        { where: { highlited_position: newHighlitedPosition, id_article: { [Op.ne]: idArticle } } }
                    );
                } catch (e) {
                    if (!e.message?.includes('highlited_position') && !e.message?.includes('does not exist')) throw e;
                }
            }
        }
        const payload = buildUpdatePayload(article, articleData, true);
        if (Object.keys(payload).length === 0) {
            return toApiArticle(article);
        }
        await ArticleModel.update(payload, { where: { id_article: idArticle } });
        const updated = await ArticleModel.findByPk(idArticle);
        return toApiArticle(updated);
    } catch (error) {
        if (isArticleEventColumnsMissingError(error)) {
            try {
                await ensureArticleEventColumns();
                return updateArticle(idArticle, articleData);
            } catch (retryError) {
                throw retryError;
            }
        }
        if (isHighlitedPositionMissingError(error)) {
            try {
                const article = await ArticleModel.findByPk(idArticle, { attributes: ARTICLE_ATTRIBUTES_WITHOUT_HIGHLITED });
                if (!article) throw new Error(`Article with id ${idArticle} not found`);
                const payload = buildUpdatePayload(article, articleData, false);
                if (Object.keys(payload).length > 0) {
                    await ArticleModel.update(payload, { where: { id_article: idArticle } });
                }
                const updated = await ArticleModel.findByPk(idArticle, { attributes: ARTICLE_ATTRIBUTES_WITHOUT_HIGHLITED });
                return { ...toApiArticle(updated), highlited_position: "" };
            } catch (fallbackError) {
                if (fallbackError.message?.includes('not found')) throw fallbackError;
                console.error('Error in updateArticle fallback:', fallbackError);
                throw fallbackError;
            }
        }
        console.error('Error updating article in database:', error);
        throw error;
    }
}

export async function deleteArticle(idArticle) {
    try {
        let article = await ArticleModel.findByPk(idArticle);
        if (!article) {
            throw new Error(`Article with id ${idArticle} not found`);
        }
        await article.destroy();
        return toApiArticle(article);
    } catch (error) {
        if (isHighlitedPositionMissingError(error)) {
            try {
                const article = await ArticleModel.findByPk(idArticle, { attributes: ARTICLE_ATTRIBUTES_WITHOUT_HIGHLITED });
                if (!article) throw new Error(`Article with id ${idArticle} not found`);
                await article.destroy();
                return { ...toApiArticle(article), highlited_position: "" };
            } catch (fallbackError) {
                if (fallbackError.message?.includes('not found')) throw fallbackError;
                console.error('Error in deleteArticle fallback:', fallbackError);
                throw fallbackError;
            }
        }
        console.error('Error deleting article from database:', error);
        throw error;
    }
}



