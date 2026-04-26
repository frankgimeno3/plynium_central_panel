/**
 * When a directory "product" panel ticket is marked solved (Done), create the product in RDS
 * and related product_portals + user_notifications rows.
 */
import { QueryTypes } from "sequelize";
import NotificationDbModel from "../notification_db/NotificationDbModel.js";
import "../../database/models.js";
import { createProduct } from "../product/ProductService.js";

function newProductId() {
  return `prod_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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
  return panelTicketUpdatesAsArray(updates).some((e) => e && String(e.action) === "product_directory_fulfilled");
}

async function getCompanyPortalIds(sequelize, companyId, transaction) {
  const rows = await sequelize.query(
    `SELECT portal_id
     FROM public.company_portals
     WHERE company_id = :companyId
     ORDER BY portal_id ASC`,
    { replacements: { companyId }, type: QueryTypes.SELECT, transaction }
  );
  return (Array.isArray(rows) ? rows : [])
    .map((r) => Number(r.portal_id))
    .filter((n) => Number.isFinite(n) && n > 0);
}

async function getActiveCompanyEmployeeUserIds(sequelize, companyId, transaction) {
  const rows = await sequelize.query(
    `SELECT DISTINCT er.employee_user_id AS user_id
     FROM public.employee_relations er
     WHERE er.employee_company_id = :companyId
       AND er.employee_rel_status = 'active'`,
    { replacements: { companyId }, type: QueryTypes.SELECT, transaction }
  );
  return (Array.isArray(rows) ? rows : [])
    .map((r) => String(r.user_id ?? "").trim())
    .filter(Boolean);
}

/**
 * @param {string} ticketId
 * @param {string} previousState
 * @param {string} newState
 * @param {{ force?: boolean }} [options]
 */
export async function maybeFulfillProductDirectoryRequest(ticketId, previousState, newState, options = {}) {
  if (!NotificationDbModel.sequelize) return;
  const prev = String(previousState ?? "").toLowerCase();
  const next = String(newState ?? "").toLowerCase();
  const force = Boolean(options?.force);
  if (!force) {
    if (next !== "solved" || prev === "solved") return;
  } else if (next !== "solved") {
    return;
  }

  const row = await NotificationDbModel.findByPk(ticketId);
  if (!row) return;
  const plain = row.get ? row.get({ plain: true }) : row;
  if (String(plain.panel_ticket_type ?? "").toLowerCase() !== "product") return;
  if (panelTicketUpdatesHasFulfillment(plain.panel_ticket_updates_array)) return;

  const sequelize = NotificationDbModel.sequelize;
  const [pd] = await sequelize.query(
    `SELECT
       ticket_id,
       ticket_product_name,
       ticket_product_description,
       ticket_product_price,
       ticket_product_company_id,
       ticket_product_main_image_src,
       ticket_product_categories_array
     FROM public.panel_ticket_product_data
     WHERE ticket_id = :ticketId
     LIMIT 1`,
    { replacements: { ticketId }, type: QueryTypes.SELECT }
  );
  if (!pd) return;

  const productName = String(pd.ticket_product_name ?? "").trim();
  const productDescription = String(pd.ticket_product_description ?? "").trim();
  const mainImageSrc = String(pd.ticket_product_main_image_src ?? "").trim();
  const companyId = String(pd.ticket_product_company_id ?? "").trim();
  const price = Number(pd.ticket_product_price ?? 0) || 0;
  const categories = Array.isArray(pd.ticket_product_categories_array)
    ? pd.ticket_product_categories_array.map(String).map((s) => s.trim()).filter(Boolean)
    : [];
  if (!companyId || !productName) return;

  const productId = newProductId();
  const redir = `/directory/products/${encodeURIComponent(productId)}`;

  await sequelize.transaction(async (transaction) => {
    const portalIds = await getCompanyPortalIds(sequelize, companyId, transaction);

    await createProduct({
      productId,
      productName,
      price,
      company: companyId,
      productDescription,
      mainImageSrc,
      productCategoriesArray: categories,
      portalIds,
    });

    const userIds = await getActiveCompanyEmployeeUserIds(sequelize, companyId, transaction);
    const notifContent = `A new product has been published for your company: ${productName || productId}`;

    for (const uid of userIds) {
      for (const pid of portalIds.length > 0 ? portalIds : [1]) {
        await sequelize.query(
          `INSERT INTO public.user_notifications (
             user_id, portal_id, notification_type, notification_content,
             notification_status, notification_redirection
           ) VALUES (
             :uid::uuid, :portalId, 'product_published', :content,
             'pending', :redir
           )`,
          {
            replacements: { uid, portalId: pid, content: notifContent, redir },
            transaction,
          }
        );
      }
    }

    const fulfillmentEntry = JSON.stringify([
      {
        action: "product_directory_fulfilled",
        company_id: companyId,
        product_id: productId,
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
}

