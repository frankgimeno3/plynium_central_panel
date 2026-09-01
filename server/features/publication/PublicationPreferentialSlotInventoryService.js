import { Op, QueryTypes } from "sequelize";
import {
    PublicationModel,
    PublicationPreferentialSlotDbModel,
    ServiceDbModel,
    MagazineDbModel,
} from "../../database/models.js";
import { displayTitleForPreferentialPosition } from "./publicationPreferentialSlots.js";
import {
    loadActiveProposalOffersForPreferentialRows,
    loadOfferedProposalIdsByPublicationSlotId,
    mergeSlotOfferState,
    uniqueNonEmptyStrings,
} from "./preferentialOfferEnrichment.js";
import ProposalDbModel from "../proposal_db/ProposalDbModel.js";
import "../../database/models.js";

const PENDING_PUBLICATION_STATUSES = ["draft", "planned"];

function normalizeText(value) {
    return String(value ?? "").trim();
}

function normalizeLower(value) {
    return normalizeText(value).toLowerCase();
}

/**
 * Flat inventory rows for pending publications' preferential placements.
 *
 * @param {{
 *   portal_id?: number | string | null,
 *   magazine_id?: string | null,
 *   publication_id?: string | null,
 *   publication_name?: string | null,
 *   service_group_id?: string | null,
 *   customer_id?: string | null,
 * }} [filters]
 */
export async function listPendingPublicationPreferentialSlots(filters = {}) {
    const sequelize = PublicationPreferentialSlotDbModel.sequelize;
    if (!sequelize) {
        throw new Error("PublicationPreferentialSlotDbModel not initialized");
    }

    const where = {
        publication_status: { [Op.in]: PENDING_PUBLICATION_STATUSES },
    };
    if (filters.magazine_id) {
        where.magazine_id = normalizeText(filters.magazine_id);
    }
    if (filters.publication_id) {
        where.publication_id = {
            [Op.iLike]: `%${normalizeText(filters.publication_id)}%`,
        };
    }
    if (filters.publication_name) {
        where.publication_edition_name = {
            [Op.iLike]: `%${normalizeText(filters.publication_name)}%`,
        };
    }

    const publications = await PublicationModel.findAll({
        where,
        attributes: [
            "publication_id",
            "magazine_id",
            "publication_edition_name",
            "publication_status",
        ],
        order: [
            ["publication_year", "DESC"],
            ["publication_expected_publication_month", "DESC"],
            ["publication_id", "DESC"],
        ],
    });

    const publicationIds = publications
        .map((row) => normalizeText(row.get("publication_id")))
        .filter(Boolean);
    if (!publicationIds.length) {
        return { rows: [] };
    }

    const prefRows = await PublicationPreferentialSlotDbModel.findAll({
        where: { publication_id: { [Op.in]: publicationIds } },
    });
    if (!prefRows.length) {
        return { rows: [] };
    }

    const publicationById = new Map(
        publications.map((row) => {
            const plain = row.get({ plain: true });
            return [normalizeText(plain.publication_id), plain];
        })
    );

    const magazineIds = [
        ...new Set(
            publications
                .map((row) => normalizeText(row.get("magazine_id")))
                .filter(Boolean)
        ),
    ];
    const magazines = magazineIds.length
        ? await MagazineDbModel.findAll({
              where: { id_magazine: { [Op.in]: magazineIds } },
              attributes: ["id_magazine", "name"],
          })
        : [];
    const magazineNameById = new Map(
        magazines.map((row) => {
            const plain = row.get({ plain: true });
            return [normalizeText(plain.id_magazine), normalizeText(plain.name)];
        })
    );

    const serviceGroupIds = [
        ...new Set(
            prefRows
                .map((row) => normalizeText(row.get("service_group_id")))
                .filter(Boolean)
        ),
    ];
    const generalServices = serviceGroupIds.length
        ? await ServiceDbModel.findAll({
              where: { service_id: { [Op.in]: serviceGroupIds } },
              attributes: ["service_id", "service_full_name"],
          })
        : [];
    const serviceGroupNameById = new Map(
        generalServices.map((row) => {
            const plain = row.get({ plain: true });
            return [
                normalizeText(plain.service_id),
                normalizeText(plain.service_full_name),
            ];
        })
    );

    const portalRowsByMagazineId = new Map();
    if (magazineIds.length) {
        try {
            const portalRows = await sequelize.query(
                `SELECT mp.magazine_id::text AS magazine_id,
                        p.portal_id,
                        p.portal_name
                 FROM public.magazine_portals mp
                 JOIN public.portals_id p ON p.portal_id = mp.portal_id
                 WHERE mp.magazine_id IN (:magazineIds)
                 ORDER BY p.portal_name ASC`,
                {
                    replacements: { magazineIds },
                    type: QueryTypes.SELECT,
                }
            );
            for (const row of portalRows || []) {
                const magazineId = normalizeText(row.magazine_id);
                if (!magazineId) continue;
                if (!portalRowsByMagazineId.has(magazineId)) {
                    portalRowsByMagazineId.set(magazineId, []);
                }
                portalRowsByMagazineId.get(magazineId).push({
                    portal_id: row.portal_id != null ? Number(row.portal_id) : null,
                    portal_name: normalizeText(row.portal_name),
                });
            }
        } catch (error) {
            const message = String(error?.message ?? "");
            if (!message.includes("magazine_portals") || !message.includes("does not exist")) {
                throw error;
            }
        }
    }

    const portalIdFilter =
        filters.portal_id != null && filters.portal_id !== ""
            ? Number(filters.portal_id)
            : null;
    const serviceGroupFilter = normalizeLower(filters.service_group_id);
    const customerFilter = normalizeLower(filters.customer_id);

    const allPublicationSlotIds = prefRows
        .map((row) => row.get("publication_slot_id"))
        .filter((id) => id != null)
        .map((id) => Number(id))
        .filter(Number.isFinite);
    const plainPrefRows = prefRows.map((row) => row.get({ plain: true }));
    const offeredFromPages = await loadOfferedProposalIdsByPublicationSlotId("", allPublicationSlotIds);
    const offeredFromLines = await loadActiveProposalOffersForPreferentialRows(plainPrefRows);
    /** @type {Map<number, string[]>} */
    const offeredByPublicationSlotId = new Map();
    for (const [slotId, ids] of offeredFromPages.entries()) {
        offeredByPublicationSlotId.set(slotId, uniqueNonEmptyStrings(ids));
    }
    for (const [slotId, ids] of offeredFromLines.entries()) {
        const existing = offeredByPublicationSlotId.get(slotId) ?? [];
        offeredByPublicationSlotId.set(slotId, uniqueNonEmptyStrings([...existing, ...ids]));
    }
    const proposalCustomerById = new Map();
    if (customerFilter) {
        const allPropIds = new Set();
        for (const prefRow of prefRows) {
            const plain = prefRow.get({ plain: true });
            const merged = mergeSlotOfferState(plain, offeredByPublicationSlotId);
            merged.proposal_ids.forEach((id) => allPropIds.add(id));
        }
        if (allPropIds.size) {
            const props = await ProposalDbModel.findAll({
                where: { id_proposal: { [Op.in]: [...allPropIds] } },
                attributes: ["id_proposal", "id_customer"],
            });
            for (const p of props) {
                const pl = p.get({ plain: true });
                const id = normalizeText(pl.id_proposal);
                if (id) {
                    proposalCustomerById.set(id, normalizeLower(pl.id_customer));
                }
            }
        }
    }

    const rows = [];
    for (const prefRow of prefRows) {
        const plain = prefRow.get({ plain: true });
        const publicationId = normalizeText(plain.publication_id);
        const publication = publicationById.get(publicationId);
        if (!publication) continue;

        const magazineId = normalizeText(publication.magazine_id);
        const portals = portalRowsByMagazineId.get(magazineId) ?? [];
        if (
            Number.isInteger(portalIdFilter) &&
            portalIdFilter >= 0 &&
            !portals.some((portal) => Number(portal.portal_id) === portalIdFilter)
        ) {
            continue;
        }

        const serviceGroupId = normalizeText(plain.service_group_id);
        if (serviceGroupFilter && normalizeLower(serviceGroupId) !== serviceGroupFilter) {
            continue;
        }

        const assignedCustomerId = normalizeLower(plain.assigned_customer_id);
        const mergedOffer = mergeSlotOfferState(plain, offeredByPublicationSlotId);
        const proposalIds = mergedOffer.proposal_ids;
        if (customerFilter) {
            const matchesCustomer =
                assignedCustomerId === customerFilter ||
                proposalIds.some(
                    (proposalId) => proposalCustomerById.get(proposalId) === customerFilter
                );
            if (!matchesCustomer) {
                continue;
            }
        }

        const portalNames = portals
            .map((portal) => portal.portal_name)
            .filter(Boolean)
            .join(", ");

        rows.push({
            preferential_slot_id:
                plain.preferential_slot_id != null
                    ? String(plain.preferential_slot_id)
                    : "",
            position_in_magazine: normalizeText(plain.position_in_magazine),
            section_title: displayTitleForPreferentialPosition(plain.position_in_magazine),
            state: normalizeText(mergedOffer.state),
            contract_id: plain.contract_id != null ? String(plain.contract_id) : null,
            assigned_customer_id:
                plain.assigned_customer_id != null
                    ? String(plain.assigned_customer_id)
                    : null,
            proposal_ids: proposalIds,
            publication_id: publicationId,
            publication_edition_name: normalizeText(publication.publication_edition_name),
            publication_status: normalizeText(publication.publication_status),
            magazine_id: magazineId || null,
            magazine_name: magazineNameById.get(magazineId) || magazineId || null,
            portal_names: portalNames,
            portals,
            service_group_id: serviceGroupId,
            service_group_name: serviceGroupNameById.get(serviceGroupId) || serviceGroupId,
        });
    }

    rows.sort((a, b) => {
        const pubCmp = String(b.publication_id).localeCompare(String(a.publication_id));
        if (pubCmp !== 0) return pubCmp;
        return String(a.position_in_magazine).localeCompare(String(b.position_in_magazine));
    });

    return { rows };
}
