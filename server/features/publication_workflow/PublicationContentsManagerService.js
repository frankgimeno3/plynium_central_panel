import { QueryTypes } from "sequelize";
import PublicationArticleDbModel from "./PublicationArticleDbModel.js";
import { isMissingContentsManagerTable } from "./PublicationArticleService.js";
import "../../database/models.js";

/**
 * Lists every project tied to the given publication via `projects_db.publication_id`,
 * enriched with contract + customer + service + assigned slot information so
 * the Contents Manager can render a single table without extra round-trips.
 *
 * The result intentionally reuses snake_case column names (instead of mapping
 * to `id_project`-style aliases) because the Contents Manager UI deals with
 * project rows raw.
 */
export async function listProjectsForPublication(publicationId) {
    const sequelize = PublicationArticleDbModel.sequelize;
    if (!sequelize) return [];
    const pid = String(publicationId ?? "").trim();
    if (!pid) return [];

    let rows = [];
    try {
        rows = await sequelize.query(
            `SELECT
                p.project_id,
                p.contract_id,
                p.project_title,
                p.project_status,
                p.service_id,
                p.project_publication_date,
                p.publication_id,
                p.publication_slot_id,
                p.project_created_at,
                p.project_updated_at,
                c.customer_id          AS contract_customer_id,
                c.contract_title       AS contract_title,
                c.contract_amount_eur  AS contract_amount_eur,
                cu.customer_account_name AS customer_name,
                s.service_full_name    AS service_full_name,
                s.service_format       AS service_format,
                s.service_unit_price   AS service_unit_price,
                ps.slot_key            AS slot_key,
                ps.slot_content_type   AS slot_content_type,
                ps.slot_content_format AS slot_content_format_legacy,
                ps.slot_state          AS slot_state,
                ps.slot_media_url      AS slot_media_url
             FROM public.projects_db p
             LEFT JOIN public.contracts_db c
               ON c.contract_id = p.contract_id
             LEFT JOIN public.customers_db cu
               ON cu.customer_id = c.customer_id
             LEFT JOIN public.services_db s
               ON s.service_id = p.service_id
             LEFT JOIN public.publication_slots_db ps
               ON ps.publication_slot_id = p.publication_slot_id
             WHERE p.publication_id = :pid
             ORDER BY p.project_created_at ASC`,
            {
                replacements: { pid },
                type: QueryTypes.SELECT,
            }
        );
    } catch (error) {
        console.warn(
            "[PublicationContentsManagerService] listProjectsForPublication failed:",
            error?.message ?? error
        );
        return [];
    }

    return rows.map((r) => ({
        project_id: r.project_id ?? "",
        contract_id: r.contract_id ?? "",
        project_title: r.project_title ?? "",
        project_status: r.project_status ?? "",
        service_id: r.service_id ?? "",
        service_full_name: r.service_full_name ?? null,
        // services_db doesn't really have a `slot_content_format` column, but
        // some older rows store it. We expose the canonical guess as
        // `slot_content_format` (advert / article / summary / index) so the UI
        // can decide whether to render the "Add media" action.
        slot_content_format:
            r.slot_content_type
                ? String(r.slot_content_type).trim().toLowerCase()
                : (r.service_format ? String(r.service_format).trim().toLowerCase() : null),
        service_format: r.service_format ?? null,
        service_unit_price:
            r.service_unit_price != null ? Number(r.service_unit_price) : null,
        project_publication_date: r.project_publication_date ?? null,
        publication_id: r.publication_id ?? null,
        publication_slot_id:
            r.publication_slot_id != null ? Number(r.publication_slot_id) : null,
        slot_key: r.slot_key ?? null,
        slot_state: r.slot_state ?? null,
        slot_media_url: r.slot_media_url ?? null,
        customer: r.contract_customer_id
            ? {
                  customer_id: r.contract_customer_id,
                  name: r.customer_name ?? "",
              }
            : null,
        contract: r.contract_id
            ? {
                  contract_id: r.contract_id,
                  title: r.contract_title ?? "",
                  amount_eur:
                      r.contract_amount_eur != null
                          ? Number(r.contract_amount_eur)
                          : null,
              }
            : null,
        project_created_at: r.project_created_at ?? null,
        project_updated_at: r.project_updated_at ?? null,
    }));
}

function mapPortalRows(rows) {
    return (rows || []).map((r) => ({
        portal_id: Number(r.portal_id),
        portal_name: r.portal_name ?? "",
    }));
}

/**
 * Returns `{ magazine_id, magazine_name }` for the publication's magazine, or
 * null when the publication has no magazine assigned.
 */
async function getMagazineForPublication(sequelize, publicationId) {
    try {
        const rows = await sequelize.query(
            `SELECT pub.magazine_id,
                    m.magazine_name
             FROM public.publications_db pub
             LEFT JOIN public.magazines_db m
               ON m.magazine_id = pub.magazine_id
             WHERE pub.publication_id = :pid`,
            {
                replacements: { pid: String(publicationId) },
                type: QueryTypes.SELECT,
            }
        );
        const row = rows?.[0];
        const magazineId = row?.magazine_id != null ? String(row.magazine_id).trim() : "";
        if (!magazineId) return null;
        return {
            magazine_id: magazineId,
            magazine_name: row?.magazine_name != null ? String(row.magazine_name) : magazineId,
        };
    } catch (error) {
        console.warn(
            "[PublicationContentsManagerService] getMagazineForPublication failed:",
            error?.message ?? error
        );
        return null;
    }
}

/**
 * Returns a `{ portal_id, portal_name }[]` for every portal linked to the
 * publication's magazine through `magazine_portals`. Falls back to
 * `portals_db.magazine_id_array` when the bridge table is unavailable.
 */
async function listPortalsForPublication(sequelize, publicationId) {
    const replacements = { pid: String(publicationId) };
    try {
        const rows = await sequelize.query(
            `SELECT po.portal_id, po.portal_name
             FROM public.publications_db pub
             JOIN public.magazine_portals mp
               ON mp.magazine_id = pub.magazine_id
             JOIN public.portals_db po
               ON po.portal_id = mp.portal_id
             WHERE pub.publication_id = :pid
             ORDER BY po.portal_name ASC`,
            {
                replacements,
                type: QueryTypes.SELECT,
            }
        );
        return mapPortalRows(rows);
    } catch (error) {
        const message = String(error?.message ?? "");
        if (message.includes("magazine_portals") && message.includes("does not exist")) {
            try {
                const rows = await sequelize.query(
                    `SELECT po.portal_id, po.portal_name
                     FROM public.publications_db pub
                     JOIN public.portals_db po
                       ON pub.magazine_id = ANY(po.magazine_id_array)
                     WHERE pub.publication_id = :pid
                     ORDER BY po.portal_name ASC`,
                    {
                        replacements,
                        type: QueryTypes.SELECT,
                    }
                );
                return mapPortalRows(rows);
            } catch (fallbackError) {
                console.warn(
                    "[PublicationContentsManagerService] listPortalsForPublication fallback failed:",
                    fallbackError?.message ?? fallbackError
                );
                return [];
            }
        }
        console.warn(
            "[PublicationContentsManagerService] listPortalsForPublication failed:",
            error?.message ?? error
        );
        return [];
    }
}

/**
 * Returns the cutoff timestamp (ISO string) used to filter which portal
 * articles are "available" for inclusion in the upcoming magazine: the
 * `real_publication_month_date` of the most recent published publication for
 * the same magazine. Falls back to null (= no lower bound) when no prior
 * publication exists.
 */
async function getPublicationLinksByArticleIds(sequelize, articleIds, currentPublicationId) {
    const ids = [...new Set((articleIds || []).map((id) => String(id).trim()).filter(Boolean))];
    if (!ids.length) return new Map();

    try {
        const rows = await sequelize.query(
            `SELECT pa.article_id,
                    pa.publication_id,
                    pub.publication_edition_name,
                    pub.publication_status,
                    pub.magazine_id
             FROM public.publication_articles pa
             JOIN public.publications_db pub
               ON pub.publication_id = pa.publication_id
             WHERE pa.article_id IN (:article_ids)
             ORDER BY pub.publication_year DESC NULLS LAST,
                      pub.publication_expected_publication_month DESC NULLS LAST,
                      pub.publication_edition_name ASC`,
            {
                replacements: { article_ids: ids },
                type: QueryTypes.SELECT,
            }
        );
        const linksByArticleId = new Map();
        for (const row of rows || []) {
            const articleId = String(row.article_id ?? "").trim();
            if (!articleId) continue;
            if (!linksByArticleId.has(articleId)) {
                linksByArticleId.set(articleId, []);
            }
            linksByArticleId.get(articleId).push({
                publication_id: row.publication_id ?? "",
                publication_edition_name: row.publication_edition_name ?? "",
                publication_status: row.publication_status ?? "",
                magazine_id: row.magazine_id ?? null,
                is_current_publication:
                    String(row.publication_id ?? "") === String(currentPublicationId ?? ""),
            });
        }
        return linksByArticleId;
    } catch (error) {
        if (!isMissingContentsManagerTable(error)) {
            console.warn(
                "[PublicationContentsManagerService] getPublicationLinksByArticleIds failed:",
                error?.message ?? error
            );
        }
        return new Map();
    }
}

async function getMagazineLastPublishedDate(sequelize, publicationId) {
    try {
        const rows = await sequelize.query(
            `SELECT MAX(prev.real_publication_month_date) AS last_date
             FROM public.publications_db cur
             JOIN public.publications_db prev
               ON prev.magazine_id = cur.magazine_id
              AND prev.publication_id <> cur.publication_id
              AND prev.publication_status = 'published'
             WHERE cur.publication_id = :pid`,
            {
                replacements: { pid: String(publicationId) },
                type: QueryTypes.SELECT,
            }
        );
        if (rows && rows[0]?.last_date) {
            const d = rows[0].last_date;
            return d instanceof Date ? d.toISOString() : String(d);
        }
        return null;
    } catch (error) {
        console.warn(
            "[PublicationContentsManagerService] getMagazineLastPublishedDate failed:",
            error?.message ?? error
        );
        return null;
    }
}

/**
 * Lists portal articles available for selection in the Contents Manager.
 *
 * - Filters by the portal(s) of the publication's magazine.
 * - Restricts `article_published_at` to the window
 *   `(last published publication date, now()]`. When no prior publication
 *   exists, the lower bound is dropped.
 * - Enriches each row with every `publication_articles` link for that article.
 * - Optional client filters: `q` (id_article ILIKE / article_title ILIKE) and
 *   `portal_id` (limit to one of the magazine's portals).
 */
export async function listAvailablePortalArticles(publicationId, filters = {}) {
    const sequelize = PublicationArticleDbModel.sequelize;
    if (!sequelize) return { items: [], portals: [], cutoff_date: null, magazine: null };
    const pid = String(publicationId ?? "").trim();
    if (!pid) return { items: [], portals: [], cutoff_date: null, magazine: null };

    const magazine = await getMagazineForPublication(sequelize, pid);
    const portals = await listPortalsForPublication(sequelize, pid);
    const cutoffDateIso = await getMagazineLastPublishedDate(sequelize, pid);
    if (!portals.length) {
        return { items: [], portals: [], cutoff_date: cutoffDateIso, magazine };
    }
    const allowedPortalIds = portals.map((p) => p.portal_id);

    const portalIdFilter = Number(filters?.portal_id);
    const portalIdsToUse =
        Number.isInteger(portalIdFilter) && allowedPortalIds.includes(portalIdFilter)
            ? [portalIdFilter]
            : allowedPortalIds;

    const q = String(filters?.q ?? "").trim();
    const qLike = q ? `%${q}%` : null;

    const replacements = {
        portal_ids: portalIdsToUse,
        cutoff_date: cutoffDateIso,
        q_like: qLike,
        max_rows: Number.isInteger(Number(filters?.limit)) && Number(filters?.limit) > 0
            ? Math.min(Number(filters.limit), 200)
            : 100,
    };

    const cutoffClause = cutoffDateIso ? `AND ap.article_published_at > :cutoff_date` : "";
    const qClause = qLike
        ? `AND (a.id_article ILIKE :q_like OR a.article_title ILIKE :q_like)`
        : "";

    let rows = [];
    try {
        rows = await sequelize.query(
            `SELECT
                a.id_article                AS id_article,
                a.article_title             AS article_title,
                a.article_subtitle          AS article_subtitle,
                a.article_main_image_url    AS article_main_image_url,
                a.article_date              AS article_date,
                ap.article_portals_id       AS article_portals_id,
                ap.article_portal_ref_id    AS portal_id,
                ap.article_published_at     AS article_published_at,
                ap.article_status           AS article_status
             FROM public.articles_db a
             JOIN public.article_portals ap
               ON ap.article_id = a.id_article
             WHERE ap.article_portal_ref_id IN (:portal_ids)
               AND ap.article_status = 'published'
               AND ap.article_published_at <= now()
               ${cutoffClause}
               ${qClause}
             ORDER BY ap.article_published_at DESC NULLS LAST
             LIMIT :max_rows`,
            {
                replacements,
                type: QueryTypes.SELECT,
            }
        );
    } catch (error) {
        console.warn(
            "[PublicationContentsManagerService] listAvailablePortalArticles failed:",
            error?.message ?? error
        );
        rows = [];
    }

    const publicationLinksByArticleId = await getPublicationLinksByArticleIds(
        sequelize,
        rows.map((row) => row.id_article),
        pid
    );

    const items = rows.map((r) => {
        const linkedPublications =
            publicationLinksByArticleId.get(String(r.id_article)) ?? [];
        return {
            id_article: r.id_article,
            article_title: r.article_title ?? "",
            article_subtitle: r.article_subtitle ?? null,
            article_main_image_url: r.article_main_image_url ?? null,
            article_date: r.article_date ?? null,
            article_published_at: r.article_published_at ?? null,
            portal_id: r.portal_id != null ? Number(r.portal_id) : null,
            portal_name:
                portals.find((p) => p.portal_id === Number(r.portal_id))?.portal_name ?? null,
            article_status: r.article_status ?? null,
            linked_publications: linkedPublications,
            in_publication: linkedPublications.length > 0,
            in_current_publication: linkedPublications.some(
                (link) => link.is_current_publication
            ),
        };
    });

    return {
        items,
        portals,
        cutoff_date: cutoffDateIso,
        magazine,
    };
}
