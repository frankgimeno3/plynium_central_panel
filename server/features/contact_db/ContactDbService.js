import ContactDbModel from "./ContactDbModel.js";
import "../../database/models.js";

function toApiContact(row) {
    if (!row) return null;
    const plain = typeof row.get === "function" ? row.get({ plain: true }) : row;
    const fullName = `${plain.contact_name ?? plain.name ?? ""} ${plain.contact_surnames ?? ""}`.trim();
    const userIdArray = Array.isArray(plain.contact_user_id_array)
        ? plain.contact_user_id_array
        : (Array.isArray(plain.user_list_array) ? plain.user_list_array : []);
    const primaryUserId = userIdArray.length > 0 ? (userIdArray[0] ?? "") : (plain.id_user ?? "");
    return {
        id_contact: plain.id_contact ?? plain.contact_id,
        name: fullName,
        role: plain.role ?? "",
        email: plain.email ?? "",
        phone: plain.phone ?? "",
        id_customer: plain.id_customer ?? "",
        company_name: plain.company_name ?? "",
        id_user: primaryUserId ?? "",
        linkedin_profile: plain.linkedin_profile ?? "",
        based_in_country: plain.based_in_country ?? "",
        comments: [],
        userListArray: userIdArray,
    };
}

export async function getAllContacts() {
    try {
        if (!ContactDbModel.sequelize) {
            console.warn("ContactDbModel not initialized, returning empty array");
            return [];
        }
        const rows = await ContactDbModel.findAll({ order: [["contact_name", "ASC"]] });
        return rows.map(toApiContact);
    } catch (error) {
        console.error("Error fetching contacts from database:", error);
        if (
            error.name === "SequelizeConnectionError" ||
            error.name === "SequelizeConnectionRefusedError" ||
            error.message?.includes("ETIMEDOUT") ||
            error.message?.includes("ECONNREFUSED") ||
            (error.message?.includes("relation") && error.message?.includes("does not exist")) ||
            error.message?.includes("not initialized") ||
            error.message?.includes("Model not found")
        ) {
            console.warn("Database connection issue, returning empty array");
            return [];
        }
        throw error;
    }
}

export async function getContactById(idContact) {
    const row = await ContactDbModel.findByPk(idContact);
    if (!row) {
        throw new Error(`Contact with id ${idContact} not found`);
    }
    return toApiContact(row);
}

export async function getContactsByCustomerId(idCustomer) {
    try {
        if (!ContactDbModel.sequelize) return [];
        const rows = await ContactDbModel.findAll({
            where: { id_customer: idCustomer },
            order: [["contact_name", "ASC"]],
        });
        return rows.map(toApiContact);
    } catch (error) {
        console.error("Error fetching contacts by customer:", error);
        return [];
    }
}

export async function createContact(data) {
    if (!ContactDbModel.sequelize) {
        throw new Error("ContactDbModel not initialized");
    }
    const rawName = String(data.name ?? "").trim();
    const [first, ...rest] = rawName.split(/\s+/g);
    const payload = {
        id_contact: data.id_contact,
        contact_name: first || rawName || "",
        contact_surnames: rest.join(" "),
        role: data.role ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        id_customer: data.id_customer ?? "",
        company_name: data.company_name ?? "",
        contact_user_id_array: Array.isArray(data.userListArray) ? data.userListArray : (data.id_user ? [String(data.id_user)] : []),
        linkedin_profile: data.linkedin_profile ?? "",
        based_in_country: data.based_in_country ?? "",
    };
    const row = await ContactDbModel.create(payload);
    return toApiContact(row);
}

export async function updateContact(idContact, data) {
    const row = await ContactDbModel.findByPk(idContact);
    if (!row) {
        throw new Error(`Contact with id ${idContact} not found`);
    }
    const updates = {};
    if (data.name !== undefined) {
        const rawName = String(data.name ?? "").trim();
        const [first, ...rest] = rawName.split(/\s+/g);
        updates.contact_name = first || rawName || "";
        updates.contact_surnames = rest.join(" ");
    }
    if (data.role !== undefined) updates.role = data.role;
    if (data.email !== undefined) updates.email = data.email;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.id_customer !== undefined) updates.id_customer = data.id_customer;
    if (data.company_name !== undefined) updates.company_name = data.company_name;
    if (data.linkedin_profile !== undefined) updates.linkedin_profile = data.linkedin_profile;
    if (data.based_in_country !== undefined) updates.based_in_country = data.based_in_country;
    if (data.userListArray !== undefined) updates.contact_user_id_array = Array.isArray(data.userListArray) ? data.userListArray : [];
    if (data.id_user !== undefined) {
        const v = String(data.id_user ?? "").trim();
        if (v) {
            updates.contact_user_id_array = Array.isArray(updates.contact_user_id_array)
                ? updates.contact_user_id_array
                : (Array.isArray(row.contact_user_id_array) ? row.contact_user_id_array : []);
            if (!updates.contact_user_id_array.includes(v)) updates.contact_user_id_array = [...updates.contact_user_id_array, v];
        }
    }
    if (Object.keys(updates).length === 0) {
        return toApiContact(row);
    }
    await ContactDbModel.update(updates, { where: { id_contact: idContact } });
    const updated = await ContactDbModel.findByPk(idContact);
    return toApiContact(updated);
}

export async function deleteContact(idContact) {
    const row = await ContactDbModel.findByPk(idContact);
    if (!row) {
        throw new Error(`Contact with id ${idContact} not found`);
    }
    await row.destroy();
    return toApiContact(row);
}
