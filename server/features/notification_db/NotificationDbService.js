import NotificationDbModel from "./NotificationDbModel.js";
import NotificationCommentDbModel from "./NotificationCommentDbModel.js";
import NotificationCompanyContentDbModel from "./NotificationCompanyContentDbModel.js";
import AgentDbModel from "../agent_db/AgentDbModel.js";
import "../../database/models.js";

/** API body uses legacy keys (nombre_comercial, …); DB uses ticket_company_* */
function companyContentFromApi(cc) {
    if (!cc) return null;
    return {
        ticket_company_name: cc.nombre_comercial ?? "",
        ticket_company_tax_name: cc.nombre_fiscal ?? "",
        ticket_company_tax_id: cc.tax_id ?? "",
        ticket_company_creator_role: cc.cargo_creador ?? "",
        ticket_company_website: cc.web_empresa ?? "",
        ticket_company_country: cc.pais_empresa ?? "",
        ticket_company_description: cc.descripcion_empresa ?? ""
    };
}

function toApiNotification(row) {
    if (!row) return null;
    const plain = row.get ? row.get({ plain: true }) : row;
    const userArr = plain.panel_ticket_related_to_user_id_array;
    const userIdFirst = Array.isArray(userArr) && userArr.length ? userArr[0] : "";
    return {
        id: plain.panel_ticket_id,
        notification_type: plain.panel_ticket_type,
        notification_category: plain.panel_ticket_category,
        state: plain.panel_ticket_state,
        date: plain.panel_ticket_date ? plain.panel_ticket_date.toISOString() : "",
        brief_description: plain.panel_ticket_brief_description ?? "",
        description: plain.panel_ticket_full_description ?? "",
        sender_email: "",
        sender_company: "",
        sender_contact_phone: "",
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
            descripcion_empresa: plain.company_content.ticket_company_description ?? ""
        } : null
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
        }
        if (filters.notification_category) {
            where.panel_ticket_category = filters.notification_category;
        }
        if (filters.state) {
            where.panel_ticket_state = filters.state;
        }

        const { sequelize } = NotificationDbModel;
        const rows = await NotificationDbModel.findAll({
            where,
            order: [
                [sequelize.literal("panel_ticket_date DESC NULLS LAST")],
                ["panel_ticket_created_at", "DESC"]
            ],
            include: [
                { model: NotificationCommentDbModel, as: "comments" },
                { model: NotificationCompanyContentDbModel, as: "company_content" }
            ]
        });
        return rows.map(r => toApiNotification(r));
    } catch (error) {
        console.error("Error fetching notifications:", error?.message || error);
        throw error;
    }
}

export async function getNotificationById(id) {
    if (!NotificationDbModel.sequelize) {
        throw new Error("Database not configured.");
    }
    const row = await NotificationDbModel.findByPk(id, {
        include: [
            { model: NotificationCommentDbModel, as: "comments" },
            { model: NotificationCompanyContentDbModel, as: "company_content" }
        ]
    });
    if (!row) {
        throw new Error(`Notification with id ${id} not found`);
    }
    return toApiNotification(row);
}

export async function createNotification(data) {
    if (!NotificationDbModel.sequelize) {
        throw new Error("Database not configured.");
    }
    const uid = data.user_id != null && String(data.user_id).trim() !== ""
        ? [String(data.user_id).trim()]
        : [];
    const payload = {
        panel_ticket_id: data.id,
        panel_ticket_type: data.notification_type,
        panel_ticket_category: data.notification_category ?? null,
        panel_ticket_state: data.state ?? "pending",
        panel_ticket_date: data.date ? new Date(data.date) : null,
        panel_ticket_brief_description: data.brief_description ?? "",
        panel_ticket_full_description: data.description ?? "",
        panel_ticket_related_to_user_id_array: uid,
        panel_ticket_updates_array: []
    };
    const row = await NotificationDbModel.create(payload);

    if (data.company_content && data.notification_type === "company") {
        const cc = companyContentFromApi(data.company_content);
        await NotificationCompanyContentDbModel.create({
            ticket_id: row.panel_ticket_id,
            ...cc
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

    const updates = {};
    if (data.state !== undefined) updates.panel_ticket_state = data.state;
    if (data.notification_category !== undefined) updates.panel_ticket_category = data.notification_category;
    if (data.brief_description !== undefined) updates.panel_ticket_brief_description = data.brief_description;
    if (data.description !== undefined) updates.panel_ticket_full_description = data.description;

    if (Object.keys(updates).length > 0) {
        await NotificationDbModel.update(updates, { where: { panel_ticket_id: id } });
    }

    if (data.company_content) {
        const cc = companyContentFromApi(data.company_content);
        const existing = await NotificationCompanyContentDbModel.findOne({ where: { ticket_id: id } });
        if (existing) {
            await NotificationCompanyContentDbModel.update(cc, { where: { ticket_id: id } });
        } else {
            await NotificationCompanyContentDbModel.create({
                ticket_id: id,
                ...cc
            });
        }
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
