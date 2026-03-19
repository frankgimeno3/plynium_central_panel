import Database from "../../database/database.js";

function toYMD(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function toAmount(value) {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

function toApiRevenue(row) {
  return {
    id: row.id,
    type: "revenue",
    label: row.label ?? "",
    date: toYMD(row.revenue_date),
    amount_eur: toAmount(row.amount_eur),
    reference: row.reference ?? "",
  };
}

function toApiPayment(row) {
  return {
    id: row.id,
    type: "payment",
    label: row.label ?? "",
    date: toYMD(row.payment_date),
    amount_eur: toAmount(row.amount_eur),
    reference: row.reference ?? "",
    id_provider: row.id_provider != null ? String(row.id_provider) : "",
    provider_name: row.provider_name ?? "",
  };
}

function inferTypeFromId(id) {
  const s = String(id ?? "");
  if (s.startsWith("rev-")) return "revenue";
  if (s.startsWith("pay-")) return "payment";
  return null;
}

export async function getAllForecastedItems() {
  const db = Database.getInstance();
  if (!db.isConfigured()) return [];

  const sequelize = db.getSequelize();

  const [revenueRows, paymentRows] = await Promise.all([
    sequelize.query(
      `
        SELECT
          id,
          label,
          reference,
          amount_eur,
          revenue_date
        FROM revenues_db
        ORDER BY revenue_date ASC, created_at DESC
      `
    ),
    sequelize.query(
      `
        SELECT
          id,
          label,
          reference,
          amount_eur,
          payment_date,
          id_provider,
          provider_name
        FROM payments_db
        ORDER BY payment_date ASC, created_at DESC
      `
    ),
  ]);

  const revRows = Array.isArray(revenueRows?.[0]) ? revenueRows[0] : [];
  const payRows = Array.isArray(paymentRows?.[0]) ? paymentRows[0] : [];

  return [
    ...revRows.map(toApiRevenue),
    ...payRows.map(toApiPayment),
  ];
}

export async function createForecastedItem({
  type,
  amount_eur,
  forecast_date,
  related_id,
  label,
  reference,
}) {
  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");

  const sequelize = db.getSequelize();

  const cleanedRelatedId =
    related_id != null && String(related_id).trim().length > 0
      ? String(related_id).trim()
      : null;

  const cleanedLabel =
    label != null && String(label).trim().length > 0 ? String(label).trim() : "";

  const cleanedReference =
    reference != null && String(reference).trim().length > 0 ? String(reference).trim() : "";

  const idPrefix = type === "payment" ? "pay" : "rev";
  const id = `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  if (type === "revenue") {
    let id_customer = cleanedRelatedId;
    let customer_name = "";

    if (id_customer) {
      const [rows] = await sequelize.query(
        `SELECT id_customer, name FROM customers_db WHERE id_customer = :id_customer LIMIT 1`,
        { replacements: { id_customer } }
      );
      if (!rows || rows.length === 0) {
        const err = new Error(`Customer with id ${id_customer} not found`);
        err.statusCode = 400;
        throw err;
      }
      customer_name = rows[0].name ?? "";
    }

    const fallbackLabel = id_customer ? `Revenue — ${customer_name || id_customer}` : "Forecasted revenue";
    const finalLabel = cleanedLabel || fallbackLabel;

    const finalReference = cleanedReference || (id_customer ?? "");

    const sql = `
      INSERT INTO revenues_db
        (id, id_customer, customer_name, label, reference, amount_eur, revenue_date, created_at, updated_at)
      VALUES
        (:id, :id_customer, :customer_name, :label, :reference, :amount_eur, :revenue_date, NOW(), NOW())
      RETURNING id, label, reference, amount_eur, revenue_date
    `;

    const [rows] = await sequelize.query(sql, {
      replacements: {
        id,
        id_customer,
        customer_name,
        label: finalLabel,
        reference: finalReference,
        amount_eur,
        revenue_date: forecast_date,
      },
    });

    if (!rows || rows.length === 0) throw new Error("Unable to create forecasted revenue");
    return toApiRevenue(rows[0]);
  }

  if (type === "payment") {
    let id_provider = cleanedRelatedId;
    let provider_name = "";

    if (id_provider) {
      const [rows] = await sequelize.query(
        `SELECT id_provider, name FROM providers_db WHERE id_provider = :id_provider LIMIT 1`,
        { replacements: { id_provider } }
      );
      if (!rows || rows.length === 0) {
        const err = new Error(`Provider with id ${id_provider} not found`);
        err.statusCode = 400;
        throw err;
      }
      provider_name = rows[0].name ?? "";
    }

    const fallbackLabel = id_provider ? `Payment — ${provider_name || id_provider}` : "Forecasted payment";
    const finalLabel = cleanedLabel || fallbackLabel;
    const finalReference = cleanedReference || (id_provider ?? "");

    const sql = `
      INSERT INTO payments_db
        (id, id_provider, provider_name, label, reference, amount_eur, payment_date, created_at, updated_at)
      VALUES
        (:id, :id_provider, :provider_name, :label, :reference, :amount_eur, :payment_date, NOW(), NOW())
      RETURNING id, label, reference, amount_eur, payment_date
    `;

    const [rows] = await sequelize.query(sql, {
      replacements: {
        id,
        id_provider,
        provider_name,
        label: finalLabel,
        reference: finalReference,
        amount_eur,
        payment_date: forecast_date,
      },
    });

    if (!rows || rows.length === 0) throw new Error("Unable to create forecasted payment");
    return toApiPayment(rows[0]);
  }

  throw new Error(`Unsupported forecast type: ${type}`);
}

export async function getForecastedItemById(id) {
  const db = Database.getInstance();
  if (!db.isConfigured()) return null;

  const sequelize = db.getSequelize();
  const itemType = inferTypeFromId(id);

  if (itemType === "revenue") {
    const [rows] = await sequelize.query(
      `
        SELECT
          id,
          label,
          reference,
          amount_eur,
          revenue_date
        FROM revenues_db
        WHERE id = :id
        LIMIT 1
      `,
      { replacements: { id } }
    );
    if (!rows || rows.length === 0) return null;
    return toApiRevenue(rows[0]);
  }

  if (itemType === "payment") {
    const [rows] = await sequelize.query(
      `
        SELECT
          id,
          label,
          reference,
          amount_eur,
          payment_date,
          id_provider,
          provider_name
        FROM payments_db
        WHERE id = :id
        LIMIT 1
      `,
      { replacements: { id } }
    );
    if (!rows || rows.length === 0) return null;
    return toApiPayment(rows[0]);
  }

  return null;
}

export async function updateForecastedItem(id, patch) {
  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");

  const sequelize = db.getSequelize();
  const itemType = inferTypeFromId(id);

  if (itemType === "revenue") {
    const sets = [];
    const repl = { id };
    if (patch.amount_eur !== undefined && patch.amount_eur !== null) {
      sets.push("amount_eur = :amount_eur");
      repl.amount_eur = patch.amount_eur;
    }
    if (patch.label !== undefined) {
      sets.push("label = :label");
      repl.label = String(patch.label ?? "").slice(0, 512);
    }
    if (sets.length === 0) {
      const err = new Error("No updatable fields provided");
      err.statusCode = 400;
      throw err;
    }
    sets.push("updated_at = NOW()");
    const [rows] = await sequelize.query(
      `UPDATE revenues_db SET ${sets.join(", ")} WHERE id = :id RETURNING id, label, reference, amount_eur, revenue_date`,
      { replacements: repl }
    );

    if (!rows || rows.length === 0) {
      const err = new Error("Forecasted revenue not found");
      err.statusCode = 404;
      throw err;
    }

    return toApiRevenue(rows[0]);
  }

  if (itemType === "payment") {
    const sets = [];
    const repl = { id };
    if (patch.amount_eur !== undefined && patch.amount_eur !== null) {
      sets.push("amount_eur = :amount_eur");
      repl.amount_eur = patch.amount_eur;
    }
    if (patch.label !== undefined) {
      sets.push("label = :label");
      repl.label = String(patch.label ?? "").slice(0, 512);
    }
    if (patch.provider_name !== undefined) {
      sets.push("provider_name = :provider_name");
      repl.provider_name = String(patch.provider_name ?? "").slice(0, 512);
    }
    if (patch.payment_date !== undefined && patch.payment_date !== null) {
      const ymd = String(patch.payment_date).trim().slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
        sets.push("payment_date = :payment_date");
        repl.payment_date = ymd;
      }
    }
    if (patch.id_provider !== undefined) {
      const raw = patch.id_provider;
      if (raw === null || raw === "") {
        sets.push("id_provider = NULL");
      } else {
        sets.push("id_provider = :id_provider");
        repl.id_provider = String(raw).trim().slice(0, 64);
      }
    }
    if (sets.length === 0) {
      const err = new Error("No updatable fields provided");
      err.statusCode = 400;
      throw err;
    }
    sets.push("updated_at = NOW()");
    const [rows] = await sequelize.query(
      `UPDATE payments_db SET ${sets.join(", ")} WHERE id = :id RETURNING id, label, reference, amount_eur, payment_date, id_provider, provider_name`,
      { replacements: repl }
    );

    if (!rows || rows.length === 0) {
      const err = new Error("Forecasted payment not found");
      err.statusCode = 404;
      throw err;
    }

    return toApiPayment(rows[0]);
  }

  const err = new Error("Unsupported forecasted item id");
  err.statusCode = 400;
  throw err;
}

