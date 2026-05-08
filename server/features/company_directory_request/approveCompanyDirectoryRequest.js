/**
 * When a directory "company" panel ticket is marked solved (Done), create the company in RDS
 * and related admin / employee / notification rows.
 */
import { randomUUID } from "crypto";
import { QueryTypes } from "sequelize";
import NotificationDbModel from "../notification_db/NotificationDbModel.js";
import NotificationCompanyContentDbModel from "../notification_db/NotificationCompanyContentDbModel.js";
import { notificationCompanyContentInclude } from "../notification_db/panelTicketCompanyDataSchema.js";
import CompanyModel from "../company/CompanyModel.js";
import { ensureCompanyRegionColumnMapped } from "../company/companyRegionColumnSync.js";
import { regionFromCountry } from "../company/regionFromCountry.js";
import "../../database/models.js";

function defaultFulfillPortalId() {
    const n = parseInt(process.env.DIRECTORY_FULFILL_PORTAL_ID || "1", 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * @param {{ portalIds?: unknown, portalId?: unknown }} options
 * @returns {number[]} unique positive portal ids, non-empty
 */
function resolveFulfillPortalIds(options) {
    const rawList = options?.portalIds;
    const fromArray = Array.isArray(rawList)
        ? rawList.map((x) => Math.floor(Number(x))).filter((n) => Number.isFinite(n) && n > 0)
        : [];
    const uniq = [...new Set(fromArray)].sort((a, b) => a - b);
    if (uniq.length > 0) return uniq;
    const one = Math.floor(Number(options?.portalId));
    if (Number.isFinite(one) && one > 0) return [one];
    return [defaultFulfillPortalId()];
}

function panelTicketUpdatesAsArray(updates) {
    if (Array.isArray(updates)) return updates;
    if (updates && typeof updates === "string") {
        try {
            const parsed = JSON.parse(updates);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
}

function panelTicketUpdatesHasFulfillment(updates) {
    return panelTicketUpdatesAsArray(updates).some((e) => e && String(e.action) === "company_directory_fulfilled");
}

/**
 * Reads `company_id` from the latest `company_directory_fulfilled` entry (used by API + UI).
 * @param {unknown} updates
 * @returns {string | null}
 */
export function readFulfilledCompanyIdFromPanelTicketUpdates(updates) {
    const arr = panelTicketUpdatesAsArray(updates);
    for (let i = arr.length - 1; i >= 0; i--) {
        const e = arr[i];
        if (!e || typeof e !== "object") continue;
        if (String(e.action) === "company_directory_fulfilled") {
            const cid = e.company_id;
            if (typeof cid === "string" && cid.trim()) return cid.trim();
            if (cid != null && String(cid).trim()) return String(cid).trim();
        }
    }
    return null;
}

function newCompanyId() {
    return `comp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function insertCompanyPortalRow(sequelize, companyId, portalId, commercialName, transaction) {
    const baseSlug =
        (commercialName || companyId)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "") || String(companyId).replace(/_/g, "-");
    let finalSlug = baseSlug || "company";
    let suffix = 0;
    for (;;) {
        const [collision] = await sequelize.query(
            `SELECT 1 FROM public.company_portals WHERE portal_id = :portalId AND company_portal_slug = :slug LIMIT 1`,
            { replacements: { portalId, slug: finalSlug }, type: QueryTypes.SELECT, transaction }
        );
        if (!collision) break;
        finalSlug = `${baseSlug}-${++suffix}`;
    }
    await sequelize.query(
        `INSERT INTO public.company_portals (company_id, portal_id, company_portal_slug)
         SELECT :companyId, :portalId, :slug
         WHERE NOT EXISTS (
           SELECT 1 FROM public.company_portals
           WHERE company_id = :companyId AND portal_id = :portalId
         )`,
        { replacements: { companyId, portalId, slug: finalSlug }, transaction }
    );
}

/**
 * @param {string} ticketId
 * @param {string} previousState
 * @param {string} newState
 * @param {{ portalId?: number, portalIds?: number[] }} [options]
 * @returns {Promise<string | null>} New or existing fulfilled `company_id`, or null if nothing ran / not applicable.
 */
export async function maybeFulfillCompanyDirectoryRequest(ticketId, previousState, newState, options = {}) {
    if (!NotificationDbModel.sequelize) return null;
    const prev = String(previousState ?? "").toLowerCase();
    const next = String(newState ?? "").toLowerCase();
    if (next !== "solved" || prev === "solved") return null;

    const companyContentInc = await notificationCompanyContentInclude(
        NotificationCompanyContentDbModel,
        NotificationDbModel.sequelize
    );
    const row = await NotificationDbModel.findByPk(ticketId, {
        include: [companyContentInc],
    });
    if (!row) return null;
    const plain = row.get ? row.get({ plain: true }) : row;
    if (String(plain.panel_ticket_type ?? "").toLowerCase() !== "company") return null;

    if (panelTicketUpdatesHasFulfillment(plain.panel_ticket_updates_array)) {
        return readFulfilledCompanyIdFromPanelTicketUpdates(plain.panel_ticket_updates_array);
    }

    const cc = plain.company_content;
    if (!cc) return null;

    const userArr = plain.panel_ticket_related_to_user_id_array;
    const requesterUserId = Array.isArray(userArr) && userArr.length ? String(userArr[0]).trim() : "";
    if (!requesterUserId) {
        console.warn("[approveCompanyDirectoryRequest] ticket has no related user id:", ticketId);
        return null;
    }

    const commercialName = String(cc.ticket_company_name ?? "").trim();
    const country = String(cc.ticket_company_country ?? "").trim();
    const webLink = String(cc.ticket_company_website ?? "").trim();
    const mainDescription = String(cc.ticket_company_description ?? "").trim();
    const rawListFlag = cc.ticket_company_list_as_employee;
    const visibleRole = String(cc.ticket_company_creator_role ?? "").trim();
    const listAsEmployee =
        rawListFlag === true || rawListFlag === false
            ? Boolean(rawListFlag)
            : visibleRole.length > 0;
    const region = regionFromCountry(country) || "";

    const sequelize = NotificationDbModel.sequelize;
    const companyId = newCompanyId();
    const companyUrlPath = `/directory/companies/${encodeURIComponent(companyId)}`;
    const portalIds = resolveFulfillPortalIds(options);

    await ensureCompanyRegionColumnMapped(sequelize);

    await sequelize.transaction(async (transaction) => {
        await CompanyModel.create(
            {
                company_id: companyId,
                commercial_name: commercialName || companyId,
                country: country || "",
                region: region || "",
                main_description: mainDescription || "",
                main_image: "",
                mail_telephone: "",
                full_address: "",
                web_link: webLink || "",
                employee_relations_array: [],
            },
            { transaction }
        );

        for (const pid of portalIds) {
            await insertCompanyPortalRow(sequelize, companyId, pid, commercialName, transaction);
        }

        const relRole = visibleRole || "employee";
        const relStatus = listAsEmployee ? "active" : "hidden";

        const relId = randomUUID();
        await sequelize.query(
            `INSERT INTO public.employee_relations (
               employee_rel_id, employee_user_id, employee_company_id, employee_role, employee_rel_status,
               employee_rel_start_date, employee_rel_end_date
             ) VALUES (
               :relId::uuid, :uid::uuid, :companyId, :role, :status, CURRENT_DATE, NULL
             )`,
            {
                replacements: {
                    relId,
                    uid: requesterUserId,
                    companyId,
                    role: relRole,
                    status: relStatus,
                },
                transaction,
            }
        );
        if (relId) {
            await sequelize.query(
                `UPDATE public.companies_db
                 SET company_employee_relations_array = array_append(
                   COALESCE(company_employee_relations_array, '{}'::text[]),
                   :relId::text
                 )
                 WHERE company_id = :companyId`,
                { replacements: { relId: String(relId), companyId }, transaction }
            );
        }

        await sequelize.query(
            `INSERT INTO public.company_administrators (
               user_id, company_id, company_administrator_role_name,
               employee_admission_rights, employee_deletion_rights, employee_modification_rights,
               base_role_modification_rights, admin_role_modification_rights,
               product_addition_rights, product_modification_rights, product_deletion_rights,
               base_company_data_modification_rights, advanced_company_data_modification_rights
             ) VALUES (
               :uid::uuid, :companyId, 'superadmin',
               true, true, true, true, true, true, true, true, true, true
             )`,
            { replacements: { uid: requesterUserId, companyId }, transaction }
        );

        const notifContent =
            "Your company has been created. Open your directory profile from this notification.";
        for (const pid of portalIds) {
            await sequelize.query(
                `INSERT INTO public.user_notifications (
               user_id, portal_id, notification_type, notification_content,
               notification_status, notification_redirection
             ) VALUES (
               :uid::uuid, :portalId, 'company_profile_created', :content,
               'pending', :redir
             )`,
                {
                    replacements: {
                        uid: requesterUserId,
                        portalId: pid,
                        content: notifContent,
                        redir: companyUrlPath,
                    },
                    transaction,
                }
            );
        }

        const fulfillmentEntry = JSON.stringify([
            {
                action: "company_directory_fulfilled",
                company_id: companyId,
                fulfilled_at: new Date().toISOString(),
            },
        ]);
        await sequelize.query(
            `UPDATE public.panel_tickets
             SET panel_ticket_updates_array =
               COALESCE(panel_ticket_updates_array, '[]'::jsonb) || CAST(:entry AS jsonb)
             WHERE panel_ticket_id = :ticketId`,
            { replacements: { entry: fulfillmentEntry, ticketId }, transaction }
        );
    });
    return companyId;
}
