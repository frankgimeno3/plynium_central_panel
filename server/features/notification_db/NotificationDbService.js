import NotificationDbModel from "./NotificationDbModel.js";
import NotificationCommentDbModel from "./NotificationCommentDbModel.js";
import NotificationCompanyContentDbModel from "./NotificationCompanyContentDbModel.js";
import "../../database/models.js";

function toApiNotification(row) {
    if (!row) return null;
    const plain = row.get ? row.get({ plain: true }) : row;
    return {
        id: plain.id,
        notification_type: plain.notification_type,
        notification_category: plain.notification_category,
        state: plain.state,
        date: plain.date ? plain.date.toISOString() : "",
        brief_description: plain.brief_description ?? "",
        description: plain.description ?? "",
        sender_email: plain.sender_email ?? "",
        sender_company: plain.sender_company ?? "",
        sender_contact_phone: plain.sender_contact_phone ?? "",
        country: plain.country ?? "",
        user_id: plain.user_id ?? "",
        comments: Array.isArray(plain.comments) ? plain.comments.map(c => ({
            date: c.date ? (typeof c.date === 'string' ? c.date : c.date.toISOString()) : "",
            content: c.content ?? ""
        })) : [],
        company_content: plain.company_content ? {
            nombre_comercial: plain.company_content.nombre_comercial ?? "",
            nombre_fiscal: plain.company_content.nombre_fiscal ?? "",
            tax_id: plain.company_content.tax_id ?? "",
            cargo_creador: plain.company_content.cargo_creador ?? "",
            web_empresa: plain.company_content.web_empresa ?? "",
            pais_empresa: plain.company_content.pais_empresa ?? "",
            descripcion_empresa: plain.company_content.descripcion_empresa ?? ""
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
            where.notification_type = filters.notification_type;
        }
        if (filters.notification_category) {
            where.notification_category = filters.notification_category;
        }
        if (filters.state) {
            where.state = filters.state;
        }
        
        const rows = await NotificationDbModel.findAll({
            where,
            order: [["date", "DESC NULLS LAST"], ["created_at", "DESC"]],
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
    const payload = {
        id: data.id,
        notification_type: data.notification_type,
        notification_category: data.notification_category ?? null,
        state: data.state ?? "pending",
        date: data.date ? new Date(data.date) : null,
        brief_description: data.brief_description ?? "",
        description: data.description ?? "",
        sender_email: data.sender_email ?? "",
        sender_company: data.sender_company ?? "",
        sender_contact_phone: data.sender_contact_phone ?? "",
        country: data.country ?? "",
        user_id: data.user_id ?? ""
    };
    const row = await NotificationDbModel.create(payload);
    
    if (data.company_content && data.notification_type === "company") {
        await NotificationCompanyContentDbModel.create({
            notification_id: row.id,
            ...data.company_content
        });
    }
    
    return getNotificationById(row.id);
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
    if (data.state !== undefined) updates.state = data.state;
    if (data.notification_category !== undefined) updates.notification_category = data.notification_category;
    if (data.brief_description !== undefined) updates.brief_description = data.brief_description;
    if (data.description !== undefined) updates.description = data.description;
    if (data.sender_email !== undefined) updates.sender_email = data.sender_email;
    if (data.sender_company !== undefined) updates.sender_company = data.sender_company;
    if (data.sender_contact_phone !== undefined) updates.sender_contact_phone = data.sender_contact_phone;
    if (data.country !== undefined) updates.country = data.country;
    
    if (Object.keys(updates).length > 0) {
        await NotificationDbModel.update(updates, { where: { id } });
    }
    
    if (data.company_content) {
        const existing = await NotificationCompanyContentDbModel.findOne({ where: { notification_id: id } });
        if (existing) {
            await NotificationCompanyContentDbModel.update(data.company_content, { where: { notification_id: id } });
        } else {
            await NotificationCompanyContentDbModel.create({
                notification_id: id,
                ...data.company_content
            });
        }
    }
    
    return getNotificationById(id);
}

export async function addComment(notificationId, content) {
    if (!NotificationDbModel.sequelize) {
        throw new Error("Database not configured.");
    }
    const notification = await NotificationDbModel.findByPk(notificationId);
    if (!notification) {
        throw new Error(`Notification with id ${notificationId} not found`);
    }
    
    await NotificationCommentDbModel.create({
        notification_id: notificationId,
        date: new Date(),
        content
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
