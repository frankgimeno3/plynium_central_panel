import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
  PublicationSlotDbModel,
  ProjectDbModel,
  ContractDbModel,
} from "../../../../../server/database/models.js";
import "../../../../../server/database/models.js";

export const runtime = "nodejs";

function toPlain(row) {
  return row && typeof row.get === "function" ? row.get({ plain: true }) : row;
}

function toApiSlot(row) {
  const s = toPlain(row);
  if (!s) return null;
  return {
    publication_slot_id: s.publication_slot_id,
    publication_id: s.publication_id ?? null,
    publication_format: s.publication_format ?? "flipbook",
    slot_key: s.slot_key ?? "",
    slot_content_type: s.slot_content_type ?? "",
    slot_state: s.slot_state ?? "",
    customer_id: s.customer_id ?? null,
    project_id: s.project_id ?? null,
    slot_media_url: s.slot_media_url ?? null,
    slot_article_id: s.slot_article_id ?? null,
    slot_created_at: s.slot_created_at ?? null,
    slot_updated_at: s.slot_updated_at ?? null,
  };
}

const patchSchema = Joi.object({
  publication_id: Joi.string().allow(null, "").optional(),
  publication_format: Joi.string().valid("flipbook", "informer").optional(),
  slot_key: Joi.string().min(1).optional(),
  slot_content_type: Joi.string().min(1).optional(),
  slot_state: Joi.string().min(1).optional(),
  customer_id: Joi.string().allow(null, "").optional(),
  project_id: Joi.string().allow(null, "").optional(),
  slot_media_url: Joi.string().allow(null, "").optional(),
  slot_article_id: Joi.string().allow(null, "").optional(),
});

const SLOT_CONTENT_TYPE_OPTIONS = new Set(["advert", "article", "summary", "index"]);
const LOCKED_ADVERT_SLOT_KEYS = new Set(["cover", "inside_cover", "inside cover", "end", "end_page", "end page"]);
const SUMMARY_INDEX_SLOT_KEYS = new Set(["2", "4", "6", "8"]);

function numericSlotKey(slotKey) {
  const n = Number(String(slotKey ?? "").trim());
  return Number.isInteger(n) && n >= 1 ? n : null;
}

function allowedSlotContentTypes(slotKey) {
  const key = String(slotKey ?? "").trim().toLowerCase();
  if (LOCKED_ADVERT_SLOT_KEYS.has(key)) return ["advert"];
  const numeric = numericSlotKey(key);
  if (numeric != null && numeric >= 1 && numeric <= 9) {
    return SUMMARY_INDEX_SLOT_KEYS.has(String(numeric))
      ? ["advert", "summary", "index"]
      : ["advert"];
  }
  return ["advert", "article"];
}

/**
 * Resolve the customer_id for a project by walking project → contract.
 * Returns null when the project has no contract or the contract has no customer.
 */
async function customerIdForProject(projectRow, transaction) {
  if (!projectRow) return null;
  const contractId = projectRow.get("id_contract") ?? projectRow.get("contract_id");
  if (!contractId) return null;
  const contract = await ContractDbModel.findByPk(String(contractId), { transaction });
  if (!contract) return null;
  const customerId = contract.get("id_customer") ?? contract.get("customer_id");
  return customerId ? String(customerId) : null;
}

export const GET = createEndpoint(
  async (_request, _body, params) => {
    const slotId = params?.slotId;
    if (!slotId) return NextResponse.json({ message: "Missing slot id" }, { status: 400 });
    const row = await PublicationSlotDbModel.findByPk(Number(slotId));
    if (!row) return NextResponse.json({ message: "Slot not found" }, { status: 404 });
    return NextResponse.json(toApiSlot(row));
  },
  null,
  true
);

export const PATCH = createEndpoint(
  async (_request, body, params) => {
    const slotId = params?.slotId;
    if (!slotId) return NextResponse.json({ message: "Missing slot id" }, { status: 400 });
    const row = await PublicationSlotDbModel.findByPk(Number(slotId));
    if (!row) return NextResponse.json({ message: "Slot not found" }, { status: 404 });

    const sequelize = PublicationSlotDbModel.sequelize;
    const previousProjectId = row.get("project_id") ? String(row.get("project_id")) : null;

    const projectIdChanged = body.project_id !== undefined;
    const nextProjectId = projectIdChanged
      ? body.project_id
        ? String(body.project_id)
        : null
      : previousProjectId;

    // Validate the next project exists (when assigning) so we can derive
    // customer_id from the contract before persisting anything.
    let nextProject = null;
    if (projectIdChanged && nextProjectId) {
      nextProject = await ProjectDbModel.findByPk(nextProjectId);
      if (!nextProject) {
        return NextResponse.json(
          { message: `Project ${nextProjectId} not found` },
          { status: 400 }
        );
      }
    }

    if (body.slot_content_type !== undefined) {
      const nextType = String(body.slot_content_type).trim().toLowerCase();
      const nextSlotKey = body.slot_key !== undefined ? String(body.slot_key) : String(row.get("slot_key") ?? "");
      const allowedTypes = allowedSlotContentTypes(nextSlotKey);
      if (!SLOT_CONTENT_TYPE_OPTIONS.has(nextType) || !allowedTypes.includes(nextType)) {
        return NextResponse.json(
          {
            message: `Type '${nextType}' is not allowed for slot_key '${nextSlotKey}'. Allowed: ${allowedTypes.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    await sequelize.transaction(async (transaction) => {
      const updates = {};
      if (body.publication_id !== undefined) updates.publication_id = body.publication_id || null;
      if (body.publication_format !== undefined) updates.publication_format = String(body.publication_format);
      if (body.slot_key !== undefined) updates.slot_key = String(body.slot_key);
      if (body.slot_content_type !== undefined) updates.slot_content_type = String(body.slot_content_type).trim().toLowerCase();
      if (body.slot_state !== undefined) updates.slot_state = String(body.slot_state);
      if (body.customer_id !== undefined) updates.customer_id = body.customer_id || null;
      if (projectIdChanged) updates.project_id = nextProjectId;
      if (body.slot_media_url !== undefined) updates.slot_media_url = body.slot_media_url || null;
      if (body.slot_article_id !== undefined) updates.slot_article_id = body.slot_article_id || null;

      // When project_id changes we mirror the relationship onto projects_db
      // (publication_id + publication_slot_id) and copy the project's customer
      // (via its contract) onto the slot — unless the caller is overriding
      // customer_id explicitly in the same request.
      if (projectIdChanged) {
        if (nextProject) {
          const derivedCustomerId = await customerIdForProject(nextProject, transaction);
          if (body.customer_id === undefined && derivedCustomerId != null) {
            updates.customer_id = derivedCustomerId;
          }
        } else if (body.customer_id === undefined) {
          // Clearing the project: drop the inherited customer too unless the
          // caller specified one in the same patch.
          updates.customer_id = null;
        }
      }

      await row.update(updates, { transaction });

      if (projectIdChanged) {
        // 1. Detach the previous project (only if it pointed at *this* slot).
        if (previousProjectId && previousProjectId !== nextProjectId) {
          const previousProject = await ProjectDbModel.findByPk(previousProjectId, { transaction });
          if (previousProject) {
            const linkedSlotId = previousProject.get("publication_slot_id");
            if (linkedSlotId == null || Number(linkedSlotId) === Number(slotId)) {
              await previousProject.update(
                { publication_id: null, publication_slot_id: null },
                { transaction }
              );
            }
          }
        }

        // 2. Attach the new project to this slot's publication.
        if (nextProject) {
          await nextProject.update(
            {
              publication_id: row.get("publication_id"),
              publication_slot_id: Number(slotId),
            },
            { transaction }
          );
        }
      }
    });

    await row.reload();
    return NextResponse.json(toApiSlot(row));
  },
  patchSchema,
  true
);

