import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
  PublicationSlotDbModel,
  ProjectDbModel,
  ContractDbModel,
} from "../../../../../server/database/models.js";
import { normalizeMagazinePageLayout } from "../../../../../server/features/publication_workflow/magazinePageLayout.js";
import "../../../../../server/database/models.js";
import { compactPublicationSlotsAfterDelete } from "../../../../../server/features/publication/compactPublicationSlotsAfterDelete.js";
import { triggerRegeneratePublicationIndexAndSummary } from "../../../../../server/features/publication/PublicationIndexSummaryService.js";

export const runtime = "nodejs";

function toPlain(row) {
  return row && typeof row.get === "function" ? row.get({ plain: true }) : row;
}

function toApiSlot(row) {
  const s = toPlain(row);
  if (!s) return null;
  const publication_page =
    s.publication_page != null && Number.isFinite(Number(s.publication_page))
      ? Number(s.publication_page)
      : null;
  const slot_ordinal =
    s.slot_ordinal != null && Number.isFinite(Number(s.slot_ordinal)) ? Number(s.slot_ordinal) : null;
  return {
    publication_slot_id: s.publication_slot_id,
    publication_id: s.publication_id ?? null,
    publication_format: s.publication_format ?? "flipbook",
    slot_key: s.slot_key ?? "",
    publication_page,
    slot_ordinal,
    slot_content_type: s.slot_content_type ?? "",
    slot_state: s.slot_state ?? "",
    customer_id: s.customer_id ?? null,
    project_id: s.project_id ?? null,
    slot_media_url: s.slot_media_url ?? null,
    slot_article_id: s.slot_article_id ?? null,
    magazine_page_layout: normalizeMagazinePageLayout(s.magazine_page_layout),
    slot_created_at: s.slot_created_at ?? null,
    slot_updated_at: s.slot_updated_at ?? null,
  };
}

const patchSchema = Joi.object({
  publication_id: Joi.string().allow(null, "").optional(),
  publication_format: Joi.string().valid("flipbook", "informer").optional(),
  slot_key: Joi.string().min(1).optional(),
  publication_page: Joi.number().optional(),
  slot_content_type: Joi.string().min(1).optional(),
  slot_state: Joi.string().min(1).optional(),
  customer_id: Joi.string().allow(null, "").optional(),
  project_id: Joi.string().allow(null, "").optional(),
  slot_media_url: Joi.string().allow(null, "").optional(),
  slot_article_id: Joi.string().allow(null, "").optional(),
  magazine_page_layout: Joi.string().valid("2_col_article", "3_col_article").optional(),
});

const SLOT_CONTENT_TYPE_OPTIONS = new Set(["advert", "article", "summary", "index", "padding"]);
const LOCKED_ADVERT_SLOT_KEYS = new Set(["cover", "inside_cover", "inside cover", "end", "end_page", "end page"]);
const ALLOWED_SLOT_KEYS_PATCH = new Set(["cover", "inside_cover", "end", "preferential_page", "regular_page"]);
const SUMMARY_INDEX_PUBLICATION_PAGES = new Set([2, 4, 6, 8]);

function preferentialInteriorPage(slotKey, publicationPage) {
  if (String(slotKey ?? "").trim().toLowerCase() !== "preferential_page") return null;
  const n = Math.round(Number(publicationPage));
  if (!Number.isInteger(n) || n < 1 || n > 9) return null;
  return n;
}

function allowedSlotContentTypes(slotKey, publicationPage) {
  const key = String(slotKey ?? "").trim().toLowerCase();
  if (LOCKED_ADVERT_SLOT_KEYS.has(key)) return ["advert"];
  const pref = preferentialInteriorPage(key, publicationPage);
  if (pref != null) {
    return SUMMARY_INDEX_PUBLICATION_PAGES.has(pref) ? ["advert", "summary", "index"] : ["advert"];
  }
  return ["advert", "article"];
}

const PADDING_SLOT_STATE = "padding";
const PENDING_SLOT_STATE = "pending";

/**
 * Same rules as the slot detail UI: parity `padding` rows may become advert or article;
 * once `pending`, interior preferential pages 1–9 follow summary/index rules by page number.
 */
function effectiveAllowedSlotContentTypes(slotKey, slotState, publicationPage) {
  const state = String(slotState ?? "").trim().toLowerCase();
  if (state === PADDING_SLOT_STATE) {
    return ["padding", "advert", "article"];
  }
  const key = String(slotKey ?? "").trim().toLowerCase();
  const pref = preferentialInteriorPage(key, publicationPage);
  if (state === PENDING_SLOT_STATE && pref != null) {
    return SUMMARY_INDEX_PUBLICATION_PAGES.has(pref)
      ? ["advert", "summary", "index"]
      : ["advert", "article"];
  }
  return allowedSlotContentTypes(slotKey, publicationPage);
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
      const nextSlotKey =
        body.slot_key !== undefined
          ? String(body.slot_key).trim().toLowerCase()
          : String(row.get("slot_key") ?? "").trim().toLowerCase();
      const nextPublicationPage =
        body.publication_page !== undefined && Number.isFinite(Number(body.publication_page))
          ? Number(body.publication_page)
          : Number(row.get("publication_page"));
      const currentState = String(row.get("slot_state") ?? "").trim().toLowerCase();
      if (nextType === "padding" && currentState !== PADDING_SLOT_STATE) {
        return NextResponse.json(
          {
            message:
              "slot_content_type 'padding' is only valid for rows whose slot_state is already 'padding'.",
          },
          { status: 400 }
        );
      }
      const allowedTypes = effectiveAllowedSlotContentTypes(
        nextSlotKey,
        currentState,
        nextPublicationPage
      );
      if (!SLOT_CONTENT_TYPE_OPTIONS.has(nextType) || !allowedTypes.includes(nextType)) {
        return NextResponse.json(
          {
            message: `Type '${nextType}' is not allowed for slot_key '${nextSlotKey}'. Allowed: ${allowedTypes.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    if (body.slot_key !== undefined) {
      const k = String(body.slot_key).trim().toLowerCase();
      if (!ALLOWED_SLOT_KEYS_PATCH.has(k)) {
        return NextResponse.json(
          {
            message:
              "slot_key must be one of: cover, inside_cover, end, preferential_page, regular_page.",
          },
          { status: 400 }
        );
      }
    }

    if (body.publication_page !== undefined && !Number.isFinite(Number(body.publication_page))) {
      return NextResponse.json({ message: "publication_page must be a finite number." }, { status: 400 });
    }

    await sequelize.transaction(async (transaction) => {
      const updates = {};
      if (body.publication_id !== undefined) updates.publication_id = body.publication_id || null;
      if (body.publication_format !== undefined) updates.publication_format = String(body.publication_format);
      if (body.slot_key !== undefined) updates.slot_key = String(body.slot_key).trim().toLowerCase();
      if (body.slot_content_type !== undefined) updates.slot_content_type = String(body.slot_content_type).trim().toLowerCase();
      if (body.slot_state !== undefined) updates.slot_state = String(body.slot_state);
      if (body.customer_id !== undefined) updates.customer_id = body.customer_id || null;
      if (projectIdChanged) updates.project_id = nextProjectId;
      if (body.slot_media_url !== undefined) updates.slot_media_url = body.slot_media_url || null;
      if (body.slot_article_id !== undefined) updates.slot_article_id = body.slot_article_id || null;
      if (body.magazine_page_layout !== undefined) {
        updates.magazine_page_layout = normalizeMagazinePageLayout(body.magazine_page_layout);
      }
      if (body.publication_page !== undefined) {
        const pp = Number(body.publication_page);
        updates.publication_page = pp;
        updates.slot_ordinal = pp + 1;
      }

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

    const publicationIdAfter = String(row.get("publication_id") ?? "").trim();
    if (publicationIdAfter) {
      triggerRegeneratePublicationIndexAndSummary(publicationIdAfter);
    }

    return NextResponse.json(toApiSlot(row));
  },
  patchSchema,
  true
);

/**
 * Remove an auto-inserted padding slot. Only `slot_state === "padding"` rows may be deleted.
 */
export const DELETE = createEndpoint(
  async (_request, _body, params) => {
    const slotId = params?.slotId;
    if (!slotId) return NextResponse.json({ message: "Missing slot id" }, { status: 400 });
    const row = await PublicationSlotDbModel.findByPk(Number(slotId));
    if (!row) return NextResponse.json({ message: "Slot not found" }, { status: 404 });

    const state = String(row.get("slot_state") ?? "").trim().toLowerCase();
    if (state !== PADDING_SLOT_STATE) {
      return NextResponse.json(
        { message: "Only padding slots (slot_state=padding) can be deleted via this endpoint." },
        { status: 400 }
      );
    }

    const hasProject = row.get("project_id") != null && String(row.get("project_id")).trim() !== "";
    const hasCustomer = row.get("customer_id") != null && String(row.get("customer_id")).trim() !== "";
    const hasArticle = row.get("slot_article_id") != null && String(row.get("slot_article_id")).trim() !== "";
    const hasMedia = row.get("slot_media_url") != null && String(row.get("slot_media_url")).trim() !== "";
    if (hasProject || hasCustomer || hasArticle || hasMedia) {
      return NextResponse.json(
        { message: "Cannot delete a padding slot that has project, customer, article, or media assigned." },
        { status: 400 }
      );
    }

    const sequelize = PublicationSlotDbModel.sequelize;
    await sequelize.transaction(async (transaction) => {
      const projectId = row.get("project_id") ? String(row.get("project_id")) : null;
      if (projectId) {
        const previousProject = await ProjectDbModel.findByPk(projectId, { transaction });
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
      const publicationId = String(row.get("publication_id") ?? "").trim();
      await row.destroy({ transaction });
      if (publicationId) {
        await compactPublicationSlotsAfterDelete(publicationId, { transaction });
      }
    });

    const publicationIdAfter = String(row.get("publication_id") ?? "").trim();
    if (publicationIdAfter) {
      triggerRegeneratePublicationIndexAndSummary(publicationIdAfter);
    }

    return NextResponse.json({ ok: true });
  },
  null,
  true
);

