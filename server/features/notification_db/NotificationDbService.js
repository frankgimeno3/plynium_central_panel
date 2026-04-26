import NotificationDbModel from "./NotificationDbModel.js";
import NotificationCommentDbModel from "./NotificationCommentDbModel.js";
import NotificationCompanyContentDbModel from "./NotificationCompanyContentDbModel.js";
import NotificationAdvertisementDbModel from "./NotificationAdvertisementDbModel.js";
import AgentDbModel from "../agent_db/AgentDbModel.js";
import "../../database/models.js";
import { maybeFulfillCompanyDirectoryRequest } from "../company_directory_request/approveCompanyDirectoryRequest.js";
import { maybeFulfillProductDirectoryRequest } from "../product_directory_request/approveProductDirectoryRequest.js";
import {
    notificationCompanyContentInclude,
    omitTicketCompanyListAsEmployeeIfNeeded,
    panelTicketCompanyDataHasListAsEmployeeColumn
} from "./panelTicketCompanyDataSchema.js";
import { QueryTypes } from "sequelize";

/** API body uses legacy keys (nombre_comercial, …); DB uses ticket_company_* */
function companyContentFromApi(cc, existingPlain = null) {
    if (!cc) return null;
    const listAs =
        cc.list_as_employee !== undefined || cc.ticket_company_list_as_employee !== undefined
            ? Boolean(cc.list_as_employee ?? cc.ticket_company_list_as_employee)
            : existingPlain != null
              ? Boolean(existingPlain.ticket_company_list_as_employee)
              : false;
    return {
        ticket_company_name: cc.nombre_comercial ?? existingPlain?.ticket_company_name ?? "",
        ticket_company_tax_name: cc.nombre_fiscal ?? existingPlain?.ticket_company_tax_name ?? "",
        ticket_company_tax_id: cc.tax_id ?? existingPlain?.ticket_company_tax_id ?? "",
        ticket_company_creator_role: cc.cargo_creador ?? existingPlain?.ticket_company_creator_role ?? "",
        ticket_company_website: cc.web_empresa ?? existingPlain?.ticket_company_website ?? "",
        ticket_company_country: cc.pais_empresa ?? existingPlain?.ticket_company_country ?? "",
        ticket_company_description: cc.descripcion_empresa ?? existingPlain?.ticket_company_description ?? "",
        ticket_company_list_as_employee: listAs
    };
}

function advertisementContentFromApi(a) {
    if (!a) return null;
    return {
        contact_full_name: String(a.contact_full_name ?? "").trim(),
        contact_email: String(a.contact_email ?? "").trim(),
        company_country: String(a.company_country ?? "").trim(),
        phone_country_prefix: String(a.phone_country_prefix ?? "").trim(),
        phone_number: String(a.phone_number ?? "").trim(),
        interest: String(a.interest ?? "").trim(),
        message: String(a.message ?? "").trim(),
        terms_accepted: Boolean(a.terms_accepted),
        services_array: Array.isArray(a.services_array) ? a.services_array.map(String) : []
    };
}

function mapAdvertisementToApi(adv) {
    if (!adv) return null;
    const plain = adv.get ? adv.get({ plain: true }) : adv;
    const services = Array.isArray(plain.services_array) ? plain.services_array : [];
    return {
        contact_full_name: plain.contact_full_name ?? "",
        contact_email: plain.contact_email ?? "",
        company_country: plain.company_country ?? "",
        phone_country_prefix: plain.phone_country_prefix ?? "",
        phone_number: plain.phone_number ?? "",
        interest: plain.interest ?? "",
        message: plain.message ?? "",
        terms_accepted: Boolean(plain.terms_accepted),
        services_array: services
    };
}

/** Legacy mediakit body: FROM / Interest / Phone blocks + message. */
function parseLegacyAdvertisementDescription(full) {
    const raw = String(full ?? "");
    const out = {
        sender_email: "",
        sender_company: "",
        sender_contact_phone: "",
        interest: "",
        message: raw.trim(),
    };
    const fromM = raw.match(/^FROM:\s*(.+?)\s+WITH\s+EMAIL:\s*(\S+)/im);
    if (fromM) {
        out.sender_company = String(fromM[1]).trim();
        out.sender_email = String(fromM[2]).trim();
    }
    const interestM = raw.match(/^Interest:\s*(.+)$/im);
    if (interestM) out.interest = String(interestM[1]).trim();
    const phoneM = raw.match(/^Phone:\s*(.+)$/im);
    if (phoneM) out.sender_contact_phone = String(phoneM[1]).trim();

    let body = raw;
    if (fromM) {
        body = body.replace(/^FROM:\s*.+?\n*/im, "");
    }
    body = body.replace(/^Interest:\s*.+?\n*/im, "");
    body = body.replace(/^Phone:\s*.+?\n*/im, "");
    body = body.replace(/^\s*\n+/, "").trim();
    if (body) out.message = body;
    return out;
}

function toApiNotification(row) {
    if (!row) return null;
    const plain = row.get ? row.get({ plain: true }) : row;
    const userArr = plain.panel_ticket_related_to_user_id_array;
    const userIdFirst = Array.isArray(userArr) && userArr.length ? userArr[0] : "";
    const ticketType = String(plain.panel_ticket_type ?? "").toLowerCase();
    let sender_email = String(plain.panel_ticket_contact_email ?? "").trim();
    let sender_company = String(plain.panel_ticket_contact_name ?? "").trim();
    let sender_contact_phone = String(plain.panel_ticket_contact_phone ?? "").trim();
    let interest = String(plain.panel_ticket_interest ?? "").trim();
    let description = plain.panel_ticket_full_description ?? "";

    const advApi = mapAdvertisementToApi(plain.advertisement_request);
    const advServices = advApi?.services_array ?? [];

    if (ticketType === "advertisement" && !sender_email && description && !advApi?.contact_email) {
        const parsed = parseLegacyAdvertisementDescription(description);
        if (!sender_email) sender_email = parsed.sender_email;
        if (!sender_company) sender_company = parsed.sender_company;
        if (!sender_contact_phone) sender_contact_phone = parsed.sender_contact_phone;
        if (!interest) interest = parsed.interest;
        if (parsed.message) description = parsed.message;
    }

    return {
        id: plain.panel_ticket_id,
        notification_type: plain.panel_ticket_type,
        state: plain.panel_ticket_state,
        date: plain.panel_ticket_date ? plain.panel_ticket_date.toISOString() : "",
        brief_description: plain.panel_ticket_brief_description ?? "",
        description,
        interest,
        services_array: ticketType === "advertisement" ? advServices : [],
        sender_email,
        sender_company,
        sender_contact_phone,
        country: "",
        user_id: userIdFirst,
        panel_ticket_updates_array: plain.panel_ticket_updates_array ?? [],
        comments: Array.isArray(plain.comments) ? plain.comments.map(c => ({
            date: c.panel_ticket_comment_date
                ? (typeof c.panel_ticket_comment_date === "string" ? c.panel_ticket_comment_date : c.panel_ticket_comment_date.toISOString())
                : "",
            content: c.panel_ticket_comment_content ?? "",
            agent_id: c.agent_id ?? ""
        })) : [],
        company_content: plain.company_content ? {
            nombre_comercial: plain.company_content.ticket_company_name ?? "",
            nombre_fiscal: plain.company_content.ticket_company_tax_name ?? "",
            tax_id: plain.company_content.ticket_company_tax_id ?? "",
            cargo_creador: plain.company_content.ticket_company_creator_role ?? "",
            web_empresa: plain.company_content.ticket_company_website ?? "",
            pais_empresa: plain.company_content.ticket_company_country ?? "",
            descripcion_empresa: plain.company_content.ticket_company_description ?? "",
            list_as_employee: Boolean(plain.company_content?.ticket_company_list_as_employee)
        } : null,
        product_content: plain.product_content ?? null,
        advertisement_request: advApi
    };
}

async function loadProductContent(sequelize, ticketId) {
    const rows = await sequelize.query(
        `SELECT
           ticket_product_name,
           ticket_product_description,
           ticket_product_price,
           ticket_product_company_id,
           ticket_product_main_image_src,
           ticket_product_categories_array,
           updated_at
         FROM public.panel_ticket_product_data
         WHERE ticket_id = :id
         LIMIT 1`,
        { replacements: { id: ticketId }, type: QueryTypes.SELECT }
    );
    const r = Array.isArray(rows) ? rows[0] : rows;
    if (!r) return null;
    return {
        product_name: String(r.ticket_product_name ?? ""),
        product_description: String(r.ticket_product_description ?? ""),
        product_price: Number(r.ticket_product_price ?? 0) || 0,
        company_id: String(r.ticket_product_company_id ?? ""),
        product_main_image_src: String(r.ticket_product_main_image_src ?? ""),
        product_categories_array: Array.isArray(r.ticket_product_categories_array) ? r.ticket_product_categories_array.map(String) : [],
        updated_at: r.updated_at ? (typeof r.updated_at === "string" ? r.updated_at : r.updated_at.toISOString()) : "",
    };
}

export async function getAllNotifications(filters = {}) {
    if (!NotificationDbModel.sequelize) {
        throw new Error("Database not configured. Notifications could not be loaded.");
    }
    try {
        const where = {};
        if (filters.notification_type) {
            where.panel_ticket_type = filters.notification_type;
        } else if (filters.notification_category) {
            where.panel_ticket_type = filters.notification_category;
        }
        if (filters.state) {
            where.panel_ticket_state = filters.state;
        }

        const { sequelize } = NotificationDbModel;
        const companyContentInc = await notificationCompanyContentInclude(NotificationCompanyContentDbModel, sequelize);
        const rows = await NotificationDbModel.findAll({
            where,
            order: [
                [sequelize.literal("panel_ticket_date DESC NULLS LAST")],
                ["panel_ticket_created_at", "DESC"]
            ],
            include: [
                { model: NotificationCommentDbModel, as: "comments" },
                companyContentInc,
                { model: NotificationAdvertisementDbModel, as: "advertisement_request" }
            ]
        });
        return rows.map(r => toApiNotification(r));
    } catch (error) {
        console.error("Error fetching notifications:", error?.message || error);
        throw error;
    }
}

/**
 * Small aggregate for UI badges / nav counts.
 * Returns:
 * - unread_inbox: unread tickets in inbox categories (account_management/production/administration)
 * - pending_company: pending company creation requests
 * - pending_other: pending other communications
 * - pending_advertisement: pending advertisement quotations
 */
export async function getNotificationCounts() {
    if (!NotificationDbModel.sequelize) {
        throw new Error("Database not configured. Notification counts could not be loaded.");
    }
    const { sequelize } = NotificationDbModel;
    const rows = await sequelize.query(
        `
        SELECT
          COUNT(*) FILTER (WHERE panel_ticket_type IN ('account_management','production','administration') AND panel_ticket_state = 'unread')::int AS unread_inbox,
          COUNT(*) FILTER (WHERE panel_ticket_type = 'company' AND panel_ticket_state = 'pending')::int AS pending_company,
          COUNT(*) FILTER (WHERE panel_ticket_type = 'other' AND panel_ticket_state = 'pending')::int AS pending_other,
          COUNT(*) FILTER (WHERE panel_ticket_type = 'advertisement' AND panel_ticket_state = 'pending')::int AS pending_advertisement
        FROM public.panel_tickets
        `,
        { type: QueryTypes.SELECT }
    );
    const r = Array.isArray(rows) ? rows[0] : rows;
    return {
        unread_inbox: Number(r?.unread_inbox ?? 0) || 0,
        pending_company: Number(r?.pending_company ?? 0) || 0,
        pending_other: Number(r?.pending_other ?? 0) || 0,
        pending_advertisement: Number(r?.pending_advertisement ?? 0) || 0
    };
}

export async function getNotificationById(id) {
    if (!NotificationDbModel.sequelize) {
        throw new Error("Database not configured.");
    }
    const { sequelize } = NotificationDbModel;
    const companyContentInc = await notificationCompanyContentInclude(NotificationCompanyContentDbModel, sequelize);
    const row = await NotificationDbModel.findByPk(id, {
        include: [
            { model: NotificationCommentDbModel, as: "comments" },
            companyContentInc,
            { model: NotificationAdvertisementDbModel, as: "advertisement_request" }
        ]
    });
    if (!row) {
        throw new Error(`Notification with id ${id} not found`);
    }
    const api = toApiNotification(row);
    const ticketType = String(api?.notification_type ?? "").toLowerCase();
    if (ticketType === "product") {
        api.product_content = await loadProductContent(sequelize, id);
    }
    return api;
}

export async function createNotification(data) {
    if (!NotificationDbModel.sequelize) {
        throw new Error("Database not configured.");
    }
    const uid = data.user_id != null && String(data.user_id).trim() !== ""
        ? [String(data.user_id).trim()]
        : [];
    let ticketType = String(data.notification_type ?? "").trim();
    const legacyCat = data.notification_category != null ? String(data.notification_category).trim() : "";
    if (ticketType.toLowerCase() === "notification" && legacyCat) {
        ticketType = legacyCat;
    }
    const payload = {
        panel_ticket_id: data.id,
        panel_ticket_type: ticketType,
        panel_ticket_state: data.state ?? "pending",
        panel_ticket_date: data.date ? new Date(data.date) : null,
        panel_ticket_brief_description: data.brief_description ?? "",
        panel_ticket_full_description: data.description ?? "",
        panel_ticket_contact_name: data.sender_company != null ? String(data.sender_company) : "",
        panel_ticket_contact_email: data.sender_email != null ? String(data.sender_email) : "",
        panel_ticket_contact_phone: data.sender_contact_phone != null ? String(data.sender_contact_phone) : "",
        panel_ticket_interest: data.interest != null ? String(data.interest) : "",
        panel_ticket_related_to_user_id_array: uid,
        panel_ticket_updates_array: []
    };
    const row = await NotificationDbModel.create(payload);

    if (data.company_content && ticketType.toLowerCase() === "company") {
        const cc = companyContentFromApi(data.company_content);
        const hasListCol = await panelTicketCompanyDataHasListAsEmployeeColumn(NotificationDbModel.sequelize);
        await NotificationCompanyContentDbModel.create({
            ticket_id: row.panel_ticket_id,
            ...omitTicketCompanyListAsEmployeeIfNeeded(cc, hasListCol)
        });
    }

    if (ticketType.toLowerCase() === "advertisement") {
        let advBody = advertisementContentFromApi(data.advertisement_request);
        if (!advBody) {
            advBody = {
                contact_full_name: String(data.sender_company ?? "").trim(),
                contact_email: String(data.sender_email ?? "").trim(),
                company_country: String(data.country ?? "").trim(),
                phone_country_prefix: "",
                phone_number: String(data.sender_contact_phone ?? "").trim(),
                interest: String(data.interest ?? "").trim(),
                message: String(data.description ?? "").trim(),
                terms_accepted: true,
                services_array: []
            };
        }
        if (Array.isArray(data.services_array) && data.services_array.length) {
            advBody.services_array = [...new Set([...advBody.services_array, ...data.services_array.map(String)])];
        }
        await NotificationAdvertisementDbModel.create({
            ticket_id: row.panel_ticket_id,
            ...advBody
        });
    }

    return getNotificationById(row.panel_ticket_id);
}

export async function updateNotification(id, data) {
    if (!NotificationDbModel.sequelize) {
        throw new Error("Database not configured.");
    }
    const row = await NotificationDbModel.findByPk(id);
    if (!row) {
        throw new Error(`Notification with id ${id} not found`);
    }
    const previousState = row.panel_ticket_state;

    const updates = {};
    if (data.state !== undefined) updates.panel_ticket_state = data.state;
    if (data.notification_type !== undefined) updates.panel_ticket_type = String(data.notification_type).trim();
    if (data.brief_description !== undefined) updates.panel_ticket_brief_description = data.brief_description;
    if (data.description !== undefined) updates.panel_ticket_full_description = data.description;
    if (data.sender_email !== undefined) updates.panel_ticket_contact_email = data.sender_email;
    if (data.sender_company !== undefined) updates.panel_ticket_contact_name = data.sender_company;
    if (data.sender_contact_phone !== undefined) updates.panel_ticket_contact_phone = data.sender_contact_phone;
    if (data.interest !== undefined) updates.panel_ticket_interest = data.interest;

    if (Object.keys(updates).length > 0) {
        await NotificationDbModel.update(updates, { where: { panel_ticket_id: id } });
    }

    if (data.company_content) {
        const hasListCol = await panelTicketCompanyDataHasListAsEmployeeColumn(NotificationDbModel.sequelize);
        const cc = companyContentFromApi(data.company_content, null);
        const ccForDb = omitTicketCompanyListAsEmployeeIfNeeded(cc, hasListCol);

        // Avoid Sequelize Model queries when column `ticket_company_list_as_employee` does not exist.
        // Some environments have not run migration 096, so selecting from the model can throw on missing column.
        const { sequelize } = NotificationDbModel;
        const existsRows = await sequelize.query(
            `SELECT 1
             FROM public.panel_ticket_company_data
             WHERE ticket_id = :id
             LIMIT 1`,
            { replacements: { id }, type: sequelize.QueryTypes.SELECT }
        );
        const exists = Array.isArray(existsRows) && existsRows.length > 0;
        const payload = { ticket_id: id, ...ccForDb };
        const fieldKeys = Object.keys(payload);

        if (exists) {
            // Update only known fields; avoids touching missing columns.
            await NotificationCompanyContentDbModel.update(payload, {
                where: { ticket_id: id },
                fields: fieldKeys,
            });
        } else {
            // Same pattern as portals/glassinformer: disable RETURNING for missing columns.
            await NotificationCompanyContentDbModel.create(payload, {
                fields: fieldKeys,
                returning: false,
            });
        }
    }

    if (data.advertisement_request) {
        const adv = advertisementContentFromApi(data.advertisement_request);
        if (adv) {
            const existingAdv = await NotificationAdvertisementDbModel.findOne({ where: { ticket_id: id } });
            if (existingAdv) {
                await NotificationAdvertisementDbModel.update(adv, { where: { ticket_id: id } });
            } else {
                await NotificationAdvertisementDbModel.create({
                    ticket_id: id,
                    ...adv
                });
            }
        }
    }

    if (data.product_content) {
        const pc = data.product_content;
        const payload = {
            ticket_product_name: pc.product_name ?? "",
            ticket_product_description: pc.product_description ?? "",
            ticket_product_price: pc.product_price ?? 0,
            ticket_product_company_id: pc.company_id ?? "",
            ticket_product_main_image_src: pc.product_main_image_src ?? "",
            ticket_product_categories_array: Array.isArray(pc.product_categories_array) ? pc.product_categories_array.map(String) : [],
            updated_at: new Date(),
        };
        const { sequelize } = NotificationDbModel;
        await sequelize.query(
            `INSERT INTO public.panel_ticket_product_data (
               ticket_id, ticket_product_name, ticket_product_description, ticket_product_price,
               ticket_product_company_id, ticket_product_main_image_src, ticket_product_categories_array, updated_at
             ) VALUES (
               :id, :name, :desc, :price, :cid, :img, :cats, :updated
             )
             ON CONFLICT (ticket_id) DO UPDATE SET
               ticket_product_name = EXCLUDED.ticket_product_name,
               ticket_product_description = EXCLUDED.ticket_product_description,
               ticket_product_price = EXCLUDED.ticket_product_price,
               ticket_product_company_id = EXCLUDED.ticket_product_company_id,
               ticket_product_main_image_src = EXCLUDED.ticket_product_main_image_src,
               ticket_product_categories_array = EXCLUDED.ticket_product_categories_array,
               updated_at = EXCLUDED.updated_at`,
            {
                replacements: {
                    id,
                    name: String(payload.ticket_product_name ?? ""),
                    desc: String(payload.ticket_product_description ?? ""),
                    price: Number(payload.ticket_product_price ?? 0) || 0,
                    cid: String(payload.ticket_product_company_id ?? ""),
                    img: String(payload.ticket_product_main_image_src ?? ""),
                    cats: payload.ticket_product_categories_array,
                    updated: payload.updated_at,
                },
                type: sequelize.QueryTypes.INSERT,
            }
        );
    }

    const newState =
        updates.panel_ticket_state !== undefined ? updates.panel_ticket_state : previousState;
    try {
        await maybeFulfillCompanyDirectoryRequest(id, previousState, newState, {
            portalId: data.fulfill_portal_id,
            portalIds: data.fulfill_portal_ids,
        });
    } catch (e) {
        console.error("[updateNotification] company directory fulfillment failed:", e?.message || e);
    }

    try {
        const force = Boolean(data.fulfill_product);
        await maybeFulfillProductDirectoryRequest(id, previousState, newState, { force });
    } catch (e) {
        console.error("[updateNotification] product directory fulfillment failed:", e?.message || e);
    }

    return getNotificationById(id);
}

export async function addComment(notificationId, content, agentId = null) {
    if (!NotificationDbModel.sequelize) {
        throw new Error("Database not configured.");
    }
    const notification = await NotificationDbModel.findByPk(notificationId);
    if (!notification) {
        throw new Error(`Notification with id ${notificationId} not found`);
    }

    let safeAgentId = null;
    if (agentId != null && String(agentId).trim() !== "" && AgentDbModel?.sequelize) {
        try {
            const agent = await AgentDbModel.findByPk(String(agentId).trim());
            if (agent) safeAgentId = String(agentId).trim();
        } catch {
            safeAgentId = null;
        }
    }

    await NotificationCommentDbModel.create({
        panel_ticket_id: notificationId,
        agent_id: safeAgentId,
        panel_ticket_comment_date: new Date(),
        panel_ticket_comment_content: content
    });

    return getNotificationById(notificationId);
}

export async function deleteNotification(id) {
    if (!NotificationDbModel.sequelize) {
        throw new Error("Database not configured.");
    }
    const row = await NotificationDbModel.findByPk(id);
    if (!row) {
        throw new Error(`Notification with id ${id} not found`);
    }
    await row.destroy();
    return toApiNotification(row);
}
