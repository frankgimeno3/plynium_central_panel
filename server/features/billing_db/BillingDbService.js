import IssuedInvoiceDbModel from "./IssuedInvoiceDbModel.js";
import OrderDbModel from "./OrderDbModel.js";
import "../../database/models.js";

function toApiIssuedInvoice(row) {
  if (!row) return null;
  const contractId = row.contract_id ?? row.id_contract ?? "";
  return {
    invoice_id: row.invoice_id,
    id_contract: contractId,
    contract_code: contractId,
    client_id: row.customer_id ?? row.client_id ?? "",
    client_name: row.customer_company ?? row.client_name ?? "",
    agent: row.agent_id ?? row.agent ?? "",
    amount_eur: row.invoice_amount_eur != null ? Number(row.invoice_amount_eur) : (row.amount_eur != null ? Number(row.amount_eur) : 0),
    issue_date: row.invoice_issue_date ?? row.issue_date ?? "",
    payment_date: row.invoice_payment_date ?? "",
    invoice_state: row.invoice_state ?? "",
  };
}

function toApiOrder(row) {
  if (!row) return null;
  return {
    order_code: row.order_code,
    invoice_id: row.invoice_id ?? "",
    id_contract: row.id_contract ?? "",
    contract_code: row.contract_code ?? "",
    client_id: row.client_id ?? "",
    client_name: row.client_name ?? "",
    agent: row.agent ?? "",
    id_contact: row.id_contact ?? "",
    collection_date: row.collection_date ?? "",
    payment_status: row.payment_status ?? "",
    amount_eur: row.amount_eur != null ? Number(row.amount_eur) : 0,
  };
}

export async function getAllIssuedInvoices() {
  try {
    if (!IssuedInvoiceDbModel.sequelize) {
      console.warn("IssuedInvoiceDbModel not initialized, returning empty array");
      return [];
    }
    const rows = await IssuedInvoiceDbModel.findAll({
      order: [["invoice_issue_date", "DESC"]],
    });
    return rows.map((r) => toApiIssuedInvoice(r.get({ plain: true })));
  } catch (error) {
    console.error("Error fetching issued invoices from database:", error);
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

export async function getIssuedInvoiceById(invoiceId) {
  const invRow = await IssuedInvoiceDbModel.findByPk(invoiceId);
  if (!invRow) throw new Error(`Issued invoice with id ${invoiceId} not found`);
  const invoice = toApiIssuedInvoice(invRow.get({ plain: true }));
  const orders = await getOrdersByInvoice(invoiceId);
  return { invoice, orders };
}

export async function getAllOrders() {
  try {
    if (!OrderDbModel.sequelize) {
      console.warn("OrderDbModel not initialized, returning empty array");
      return [];
    }
    const rows = await OrderDbModel.findAll({
      order: [["collection_date", "DESC"]],
    });
    return rows.map((r) => toApiOrder(r.get({ plain: true })));
  } catch (error) {
    console.error("Error fetching orders from database:", error);
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

export async function getOrderByCode(orderCode) {
  const row = await OrderDbModel.findByPk(orderCode);
  if (!row) throw new Error(`Order with code ${orderCode} not found`);
  return toApiOrder(row.get({ plain: true }));
}

export async function updateOrderByCode(orderCode, patch) {
  const row = await OrderDbModel.findByPk(orderCode);
  if (!row) {
    const err = new Error(`Order with code ${orderCode} not found`);
    err.statusCode = 404;
    throw err;
  }
  const updates = {};
  if (
    patch.collection_date !== undefined &&
    patch.collection_date !== null &&
    String(patch.collection_date).trim() !== ""
  ) {
    updates.collection_date = String(patch.collection_date).trim().slice(0, 10);
  }
  if (patch.amount_eur !== undefined && patch.amount_eur !== null) {
    updates.amount_eur = patch.amount_eur;
  }
  if (
    patch.payment_status !== undefined &&
    patch.payment_status !== null &&
    String(patch.payment_status).trim() !== ""
  ) {
    updates.payment_status = String(patch.payment_status).trim();
  }
  if (Object.keys(updates).length === 0) {
    return toApiOrder(row.get({ plain: true }));
  }
  await row.update(updates);
  await row.reload();
  return toApiOrder(row.get({ plain: true }));
}

export async function getOrdersByInvoice(invoiceId) {
  if (!OrderDbModel.sequelize) {
    console.warn("OrderDbModel not initialized, returning empty array");
    return [];
  }
  const rows = await OrderDbModel.findAll({
    where: { invoice_id: invoiceId },
    order: [["collection_date", "DESC"]],
  });
  return rows.map((r) => toApiOrder(r.get({ plain: true })));
}

