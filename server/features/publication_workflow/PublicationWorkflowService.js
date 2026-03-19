import PlannedPublicationDbModel from "./PlannedPublicationDbModel.js";
import FlatplanDbModel from "./FlatplanDbModel.js";
import PublicationSlotDbModel from "./PublicationSlotDbModel.js";
import "../../database/models.js";

function toApiSlot(row) {
    if (!row) return null;
    const plain = row.get ? row.get({ plain: true }) : row;
    return {
        slotKey: plain.slot_key,
        content_type: plain.content_type,
        state: plain.state,
        id_advertiser: plain.id_advertiser ?? null,
        id_project: plain.id_project ?? null,
        image_src: plain.image_src ?? null,
        article_id: plain.article_id ?? null
    };
}

function toApiPlannedPublication(row) {
    if (!row) return null;
    const plain = row.get ? row.get({ plain: true }) : row;
    const slots = Array.isArray(plain.slots) ? plain.slots.map(toApiSlot) : [];
    
    const cover = slots.find(s => s.slotKey === 'cover') || null;
    const inside_cover = slots.find(s => s.slotKey === 'inside_cover') || null;
    const end = slots.find(s => s.slotKey === 'end') || null;
    const pages = slots.filter(s => !['cover', 'inside_cover', 'end'].includes(s.slotKey));
    
    return {
        state: 'planned',
        id_publication: '',
        id_planned_publication: plain.id_planned_publication,
        id_flatplan: '',
        edition_name: plain.edition_name ?? '',
        theme: plain.theme ?? '',
        date: '',
        publication_date: plain.publication_date ?? '',
        redirectionLink: '',
        revista: '',
        número: '',
        publication_main_image_url: '',
        id_magazine: plain.id_magazine ?? '',
        year: plain.year ?? null,
        issue_number: plain.issue_number ?? null,
        cover,
        inside_cover,
        end,
        pages,
        single_available: null,
        offeredPreferentialPages: Array.isArray(plain.offered_pages) ? plain.offered_pages.map(op => ({
            pageType: op.page_type,
            slotKey: op.slot_key
        })) : []
    };
}

function toApiFlatplan(row) {
    if (!row) return null;
    const plain = row.get ? row.get({ plain: true }) : row;
    const slots = Array.isArray(plain.slots) ? plain.slots.map(toApiSlot) : [];
    
    const cover = slots.find(s => s.slotKey === 'cover') || null;
    const inside_cover = slots.find(s => s.slotKey === 'inside_cover') || null;
    const end = slots.find(s => s.slotKey === 'end') || null;
    const pages = slots.filter(s => !['cover', 'inside_cover', 'end'].includes(s.slotKey));
    
    return {
        state: 'in production',
        id_publication: '',
        id_planned_publication: '',
        id_flatplan: plain.id_flatplan,
        edition_name: plain.edition_name ?? '',
        theme: plain.theme ?? '',
        date: '',
        publication_date: plain.publication_date ?? '',
        redirectionLink: '',
        revista: '',
        número: '',
        publication_main_image_url: '',
        id_magazine: plain.id_magazine ?? '',
        year: plain.year ?? null,
        issue_number: plain.issue_number ?? null,
        cover,
        inside_cover,
        end,
        pages,
        single_available: null,
        offeredPreferentialPages: Array.isArray(plain.offered_pages) ? plain.offered_pages.map(op => ({
            pageType: op.page_type,
            slotKey: op.slot_key
        })) : []
    };
}

export async function getAllPlannedPublications() {
    if (!PlannedPublicationDbModel.sequelize) {
        throw new Error("Database not configured.");
    }
    const rows = await PlannedPublicationDbModel.findAll({
        order: [["publication_date", "ASC"]],
        include: [
            { model: PublicationSlotDbModel, as: "slots" }
        ]
    });
    return rows.map(toApiPlannedPublication);
}

export async function getPlannedPublicationById(id) {
    if (!PlannedPublicationDbModel.sequelize) {
        throw new Error("Database not configured.");
    }
    const row = await PlannedPublicationDbModel.findByPk(id, {
        include: [
            { model: PublicationSlotDbModel, as: "slots" }
        ]
    });
    if (!row) {
        throw new Error(`Planned publication with id ${id} not found`);
    }
    return toApiPlannedPublication(row);
}

export async function getAllFlatplans() {
    if (!FlatplanDbModel.sequelize) {
        throw new Error("Database not configured.");
    }
    const rows = await FlatplanDbModel.findAll({
        order: [["publication_date", "ASC"]],
        include: [
            { model: PublicationSlotDbModel, as: "slots" }
        ]
    });
    return rows.map(toApiFlatplan);
}

export async function getFlatplanById(id) {
    if (!FlatplanDbModel.sequelize) {
        throw new Error("Database not configured.");
    }
    const row = await FlatplanDbModel.findByPk(id, {
        include: [
            { model: PublicationSlotDbModel, as: "slots" }
        ]
    });
    if (!row) {
        throw new Error(`Flatplan with id ${id} not found`);
    }
    return toApiFlatplan(row);
}

/**
 * Create a flatplan (in production) for a magazine issue + default empty slots.
 * Removes the issue from "forecasted" lists once persisted (same magazine/year/issue key).
 */
export async function createFlatplan(data) {
    if (!FlatplanDbModel.sequelize) {
        throw new Error("Database not configured.");
    }
    const {
        id_flatplan,
        id_magazine,
        year,
        issue_number,
        edition_name = "",
        theme = "",
        publication_date = null,
        description = ""
    } = data;

    if (!id_flatplan || !id_magazine || year == null || issue_number == null) {
        throw new Error("id_flatplan, id_magazine, year and issue_number are required");
    }

    const y = Number(year);
    const issueNum = Number(issue_number);
    if (Number.isNaN(y) || Number.isNaN(issueNum)) {
        throw new Error("year and issue_number must be numbers");
    }

    const duplicate = await FlatplanDbModel.findOne({
        where: { id_magazine, year: y, issue_number: issueNum }
    });
    if (duplicate) {
        const err = new Error(
            `Flatplan already exists for magazine ${id_magazine}, year ${y}, issue ${issueNum}`
        );
        err.statusCode = 409;
        throw err;
    }

    const sequelize = FlatplanDbModel.sequelize;
    const t = await sequelize.transaction();
    try {
        const pubDateRaw = publication_date != null && String(publication_date).trim() !== ""
            ? String(publication_date).trim().slice(0, 10)
            : null;

        await FlatplanDbModel.create(
            {
                id_flatplan,
                id_magazine,
                year: y,
                issue_number: issueNum,
                edition_name: String(edition_name ?? "").trim() || "",
                theme: String(theme ?? "").trim() || "",
                publication_date: pubDateRaw,
                description: String(description ?? "").trim() || ""
            },
            { transaction: t }
        );

        const slotRows = [
            { flatplan_id: id_flatplan, planned_publication_id: null, slot_key: "cover", content_type: "cover", state: "pending" },
            { flatplan_id: id_flatplan, planned_publication_id: null, slot_key: "inside_cover", content_type: "inside_cover", state: "pending" }
        ];
        for (let n = 1; n <= 10; n++) {
            slotRows.push({
                flatplan_id: id_flatplan,
                planned_publication_id: null,
                slot_key: String(n),
                content_type: "advert",
                state: "pending"
            });
        }
        slotRows.push({ flatplan_id: id_flatplan, planned_publication_id: null, slot_key: "end", content_type: "end", state: "pending" });

        await PublicationSlotDbModel.bulkCreate(slotRows, { transaction: t });
        await t.commit();
    } catch (e) {
        await t.rollback();
        throw e;
    }

    return getFlatplanById(id_flatplan);
}

export async function getAllPublicationsUnified() {
    const [planned, flatplans] = await Promise.all([
        getAllPlannedPublications().catch(() => []),
        getAllFlatplans().catch(() => [])
    ]);
    return [...planned, ...flatplans];
}
