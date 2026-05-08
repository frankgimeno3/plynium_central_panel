import IssuedInvoiceDbModel from "./IssuedInvoiceDbModel.js";
import OrderDbModel from "./OrderDbModel.js";
import "../../database/models.js";

function toYMD(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function paymentStatusNormalized(s) {
  const v = String(s ?? "").trim().toLowerCase();
  return v === "paid" ? "paid" : "pending";
}

function toLinkedRevenueApi(row) {
  if (!row) return null;
  const amt = row.amount_eur != null ? Number(row.amount_eur) : 0;
  const real =
    row.revenue_real_amount_eur != null && row.revenue_real_amount_eur !== ""
      ? Number(row.revenue_real_amount_eur)
      : null;
  return {
    id: row.id,
    order_id_in_revenue: row.order_id ?? "",
    expected_amount_eur: Number.isFinite(amt) ? amt : 0,
    real_amount_eur: real !== null && Number.isFinite(real) ? real : null,
    expected_date: toYMD(row.revenue_date),
    real_payment_date: row.revenue_real_payment_date ? toYMD(row.revenue_real_payment_date) : "",
    revenue_payment_status: paymentStatusNormalized(row.revenue_payment_status),
    label: row.label ?? "",
  };
}

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

async function fetchLinkedRevenueRow(sequelize, revenueId) {
  if (!sequelize || !revenueId) return null;
  try {
    const [rows] = await sequelize.query(
      `
        SELECT id, order_id, amount_eur, revenue_real_amount_eur, revenue_date,
               revenue_real_payment_date, revenue_payment_status, label
        FROM public.revenues_db
        WHERE id = :id
        LIMIT 1
      `,
      { replacements: { id: String(revenueId) } }
    );
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
}

async function applyOrderPatchToLinkedRevenue(sequelize, revenueId, orderPlain) {
  if (!sequelize || !revenueId) return;
  const status = paymentStatusNormalized(orderPlain.order_payment_status);
  await sequelize.query(
    `
      UPDATE public.revenues_db SET
        amount_eur = :amount_eur,
        revenue_date = CAST(:revenue_date AS DATE),
        revenue_payment_status = :revenue_payment_status,
        updated_at = NOW()
      WHERE id = :id
    `,
    {
      replacements: {
        id: String(revenueId),
        amount_eur:
          orderPlain.order_total_amount_eur != null
            ? Number(orderPlain.order_total_amount_eur)
            : 0,
        revenue_date: orderPlain.order_collection_date
          ? String(orderPlain.order_collection_date).slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        revenue_payment_status: status,
      },
    }
  );
}

/** @param {{ amount_eur?: number, revenue_date?: string, revenue_payment_status?: string }} rev */
export async function syncLinkedOrderFromRevenueExpected(orderId, rev) {
  const sequelize = OrderDbModel.sequelize;
  if (!sequelize || !orderId || !rev) return;
  const amt = rev.amount_eur != null ? Number(rev.amount_eur) : undefined;
  const coll = rev.revenue_date ? String(rev.revenue_date).slice(0, 10) : undefined;
  const st =
    rev.revenue_payment_status != null ? paymentStatusNormalized(rev.revenue_payment_status) : undefined;
  const sets = [];
  const repl = { oid: String(orderId) };
  if (amt !== undefined && Number.isFinite(amt)) {
    sets.push("order_total_amount_eur = :amt");
    repl.amt = amt;
  }
  if (coll !== undefined) {
    sets.push("order_collection_date = CAST(:coll AS DATE)");
    repl.coll = coll;
  }
  if (st !== undefined) {
    sets.push("order_payment_status = :st");
    repl.st = st;
  }
  if (!sets.length) return;
  sets.push("order_updated_at = NOW()");
  await sequelize.query(`UPDATE public.orders_db SET ${sets.join(", ")} WHERE order_id = :oid`, {
    replacements: repl,
  });
}

function toApiOrder(row, linkedRevenue) {
  if (!row) return null;
  const plain = typeof row.get === "function" ? row.get({ plain: true }) : row;
  const orderId = plain.order_id ?? plain.order_code ?? "";
  return {
    order_code: orderId,
    invoice_id: plain.invoice_id ?? "",
    id_contract: plain.contract_id ?? "",
    contract_code: plain.contract_id ?? "",
    client_id: plain.customer_id ?? "",
    client_name: plain.customer_company_name ?? "",
    agent: plain.agent_id ?? "",
    id_contact: "",
    collection_date: plain.order_collection_date ? toYMD(plain.order_collection_date) : "",
    payment_status: paymentStatusNormalized(plain.order_payment_status),
    amount_eur:
      plain.order_total_amount_eur != null ? Number(plain.order_total_amount_eur) : 0,
    revenue_id: plain.revenue_id ?? "",
    linked_revenue: linkedRevenue ?? undefined,
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
      order: [["order_collection_date", "DESC"], ["order_id", "DESC"]],
    });
    const sequelize = OrderDbModel.sequelize;
    const out = [];
    for (const r of rows) {
      const p = r.get({ plain: true });
      let linked = null;
      if (p.revenue_id) {
        const lr = await fetchLinkedRevenueRow(sequelize, p.revenue_id);
        linked = toLinkedRevenueApi(lr);
      }
      out.push(toApiOrder(p, linked));
    }
    return out;
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
  const plain = row.get({ plain: true });
  const sequelize = OrderDbModel.sequelize;
  let linked = null;
  if (plain.revenue_id) {
    const lr = await fetchLinkedRevenueRow(sequelize, plain.revenue_id);
    linked = toLinkedRevenueApi(lr);
  }
  return toApiOrder(plain, linked);
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
    updates.order_collection_date = String(patch.collection_date).trim().slice(0, 10);
  }
  if (patch.amount_eur !== undefined && patch.amount_eur !== null) {
    updates.order_total_amount_eur = patch.amount_eur;
  }
  if (
    patch.payment_status !== undefined &&
    patch.payment_status !== null &&
    String(patch.payment_status).trim() !== ""
  ) {
    updates.order_payment_status = paymentStatusNormalized(patch.payment_status);
  }
  if (Object.keys(updates).length > 0) {
    await row.update(updates);
    await row.reload();
  }
  const plain = row.get({ plain: true });
  const sequelize = OrderDbModel.sequelize;
  if (patch.sync_revenue && plain.revenue_id && sequelize) {
    await applyOrderPatchToLinkedRevenue(sequelize, plain.revenue_id, plain);
  }
  let linked = null;
  if (plain.revenue_id) {
    const lr = await fetchLinkedRevenueRow(sequelize, plain.revenue_id);
    linked = toLinkedRevenueApi(lr);
  }
  return toApiOrder(plain, linked);
}

export async function getOrdersByInvoice(invoiceId) {
  if (!OrderDbModel.sequelize) {
    console.warn("OrderDbModel not initialized, returning empty array");
    return [];
  }
  const rows = await OrderDbModel.findAll({
    where: { invoice_id: invoiceId },
    order: [["order_collection_date", "DESC"]],
  });
  const sequelize = OrderDbModel.sequelize;
  const out = [];
  for (const r of rows) {
    const p = r.get({ plain: true });
    let linked = null;
    if (p.revenue_id) {
      const lr = await fetchLinkedRevenueRow(sequelize, p.revenue_id);
      linked = toLinkedRevenueApi(lr);
    }
    out.push(toApiOrder(p, linked));
  }
  return out;
}
