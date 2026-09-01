import { Op } from "sequelize";
import ProposalDbModel from "./ProposalDbModel.js";
import ProposalServiceLineDbModel from "./ProposalServiceLineDbModel.js";
import "../../database/models.js";

const ACTIVE_PROPOSAL_STATUSES = ["draft", "pending"];

/** @param {string} raw */
function parsePublicationIdFromUnitDetails(raw) {
    const text = String(raw ?? "").trim();
    if (!text) return "";
    const fromJson = text.match(/"id_planned_publication"\s*:\s*"([^"]+)"/);
    if (fromJson?.[1]) return String(fromJson[1]).trim();
    const fromHuman = text.match(/Publication id:\s*([^\s\n|]+)/i);
    if (fromHuman?.[1]) return String(fromHuman[1]).trim();
    return "";
}

/**
 * Magazine service occupancy for one publication (regular catalog services by service_id).
 *
 * @param {string} publicationId
 * @returns {Promise<{ publication_id: string, by_service_id: Record<string, "sold" | "offered"> }>}
 */
export async function getMagazineServiceAvailabilityForPublication(publicationId) {
    const publication_id = String(publicationId ?? "").trim();
    /** @type {Record<string, "sold" | "offered">} */
    const by_service_id = {};
    if (!publication_id) {
        return { publication_id, by_service_id };
    }

    const lineRows = await ProposalServiceLineDbModel.findAll({
        where: {
            [Op.or]: [{ publication_id }, { publication_id: null }],
        },
        attributes: [
            "service_id",
            "publication_id",
            "is_sold",
            "proposal_id",
            "proposal_service_unit_details",
        ],
    });
    if (!lineRows.length) {
        return { publication_id, by_service_id };
    }

    const proposalIds = [
        ...new Set(
            lineRows
                .map((r) => String(r.get("proposal_id") ?? "").trim())
                .filter(Boolean)
        ),
    ];
    const proposals = proposalIds.length
        ? await ProposalDbModel.findAll({
              where: { id_proposal: { [Op.in]: proposalIds } },
              attributes: ["id_proposal", "status"],
          })
        : [];
    const statusByProposal = new Map(
        proposals.map((p) => [
            String(p.get("id_proposal") ?? "").trim(),
            String(p.get("status") ?? "").trim().toLowerCase(),
        ])
    );

    for (const row of lineRows) {
        const sid = String(row.get("service_id") ?? "").trim();
        if (!sid) continue;

        let linePub = String(row.get("publication_id") ?? "").trim();
        if (!linePub) {
            linePub = parsePublicationIdFromUnitDetails(row.get("proposal_service_unit_details"));
        }
        if (linePub !== publication_id) continue;

        const proposalId = String(row.get("proposal_id") ?? "").trim();
        const proposalStatus = statusByProposal.get(proposalId) ?? "";
        const sold =
            Boolean(row.get("is_sold")) ||
            proposalStatus === "accepted";

        if (sold) {
            by_service_id[sid] = "sold";
            continue;
        }
        if (ACTIVE_PROPOSAL_STATUSES.includes(proposalStatus) && by_service_id[sid] !== "sold") {
            by_service_id[sid] = "offered";
        }
    }

    return { publication_id, by_service_id };
}
