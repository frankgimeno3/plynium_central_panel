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
  const expected =
    row.revenue_expected_payment_date ?? row.revenue_date ?? row.date;
  const expectedAmount = toAmount(
    row.revenue_expected_amount_eur ??
      row.revenue_amount_eur ??
      row.amount_eur
  );
  return {
    id: row.revenue_id ?? row.id,
    type: "revenue",
    label: row.revenue_label ?? row.label ?? "",
    date: toYMD(expected),
    amount_eur: expectedAmount,
    revenue_expected_amount_eur: expectedAmount,
    revenue_real_amount_eur:
      row.revenue_real_amount_eur != null && row.revenue_real_amount_eur !== ""
        ? toAmount(row.revenue_real_amount_eur)
        : null,
    reference: row.revenue_reference ?? row.reference ?? "",
    customer_name: row.customer_name ?? "",
    revenue_real_payment_date: toYMD(
      row.revenue_real_payment_date ?? row.real_payment_date
    ),
  };
}

function toApiPayment(row) {
  const expectedDate = row.payment_expected_date ?? row.payment_date;
  const expectedAmount = toAmount(
    row.payment_expected_amount_eur ?? row.amount_eur
  );
  return {
    id: row.payment_id ?? row.id,
    type: "payment",
    label: row.payment_label ?? row.label ?? "",
    date: toYMD(expectedDate),
    amount_eur: expectedAmount,
    payment_expected_amount_eur: expectedAmount,
    payment_real_amount_eur:
      row.payment_real_amount_eur != null && row.payment_real_amount_eur !== ""
        ? toAmount(row.payment_real_amount_eur)
        : null,
    reference: row.payment_reference ?? row.reference ?? "",
    id_provider:
      row.provider_id != null
        ? String(row.provider_id)
        : row.id_provider != null
          ? String(row.id_provider)
          : "",
    provider_name: row.payment_provider_name ?? row.provider_name ?? "",
    payment_expected_date: toYMD(expectedDate),
    payment_real_date: toYMD(row.payment_real_date),
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
          revenue_id AS id,
          revenue_label AS label,
          revenue_reference AS reference,
          revenue_expected_amount_eur AS amount_eur,
          revenue_real_amount_eur,
          revenue_expected_payment_date AS revenue_date,
          revenue_real_payment_date,
          customer_name
        FROM revenues_db
        ORDER BY revenue_expected_payment_date ASC, revenue_created_at DESC
      `
    ),
    sequelize.query(
      `
        SELECT
          payment_id AS id,
          payment_label AS label,
          payment_reference AS reference,
          payment_expected_amount_eur AS amount_eur,
          payment_real_amount_eur,
          payment_expected_date AS payment_date,
          payment_real_date,
          provider_id AS id_provider,
          payment_provider_name AS provider_name
        FROM payments_db
        ORDER BY payment_expected_date ASC, payment_created_at DESC
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
        `SELECT customer_id AS id_customer, customer_account_name AS name FROM customers_db WHERE customer_id = :id_customer LIMIT 1`,
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
        (revenue_id, customer_id, customer_name, revenue_label, revenue_reference, revenue_expected_amount_eur,
         revenue_real_amount_eur, revenue_expected_payment_date, revenue_real_payment_date, revenue_created_at, revenue_updated_at)
      VALUES
        (:id, :customer_id, :customer_name, :label, :reference, :amount_eur, NULL, :revenue_expected_date, NULL, NOW(), NOW())
      RETURNING revenue_id AS id, revenue_label AS label, revenue_reference AS reference,
                revenue_expected_amount_eur AS amount_eur, revenue_real_amount_eur, revenue_expected_payment_date AS revenue_date,
                revenue_real_payment_date, customer_name
    `;

    const [rows] = await sequelize.query(sql, {
      replacements: {
        id,
        customer_id: id_customer,
        customer_name: customer_name || "",
        label: finalLabel,
        reference: finalReference,
        amount_eur,
        revenue_expected_date: forecast_date,
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
        `SELECT provider_id AS id_provider, provider_company_name AS name FROM providers_db WHERE provider_id = :id_provider LIMIT 1`,
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
        (payment_id, provider_id, payment_provider_name, payment_label, payment_reference,
         payment_expected_amount_eur, payment_real_amount_eur, payment_expected_date, payment_real_date,
         payment_created_at, payment_updated_at)
      VALUES
        (:id, :provider_id, :payment_provider_name, :label, :reference, :amount_eur, NULL, :payment_expected_date, NULL,
         NOW(), NOW())
      RETURNING payment_id AS id, payment_label AS label, payment_reference AS reference,
                payment_expected_amount_eur AS amount_eur, payment_real_amount_eur,
                payment_expected_date AS payment_date, payment_real_date,
                provider_id AS id_provider, payment_provider_name AS provider_name
    `;

    const [rows] = await sequelize.query(sql, {
      replacements: {
        id,
        provider_id: id_provider,
        payment_provider_name: provider_name,
        label: finalLabel,
        reference: finalReference,
        amount_eur,
        payment_expected_date: forecast_date,
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
          revenue_id AS id,
          revenue_label AS label,
          revenue_reference AS reference,
          revenue_expected_amount_eur AS amount_eur,
          revenue_real_amount_eur,
          revenue_expected_payment_date AS revenue_date,
          revenue_real_payment_date,
          customer_name
        FROM revenues_db
        WHERE revenue_id = :id
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
          payment_id AS id,
          payment_label AS label,
          payment_reference AS reference,
          payment_expected_amount_eur AS amount_eur,
          payment_real_amount_eur,
          payment_expected_date AS payment_date,
          payment_real_date,
          provider_id AS id_provider,
          payment_provider_name AS provider_name
        FROM payments_db
        WHERE payment_id = :id
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
    const expectedAmt =
      patch.revenue_expected_amount_eur !== undefined &&
      patch.revenue_expected_amount_eur !== null
        ? patch.revenue_expected_amount_eur
        : patch.amount_eur;
    if (expectedAmt !== undefined && expectedAmt !== null) {
      sets.push("revenue_expected_amount_eur = :expected_amount_eur");
      repl.expected_amount_eur = expectedAmt;
    }
    if (patch.revenue_real_amount_eur !== undefined) {
      if (patch.revenue_real_amount_eur === null || patch.revenue_real_amount_eur === "") {
        sets.push("revenue_real_amount_eur = NULL");
      } else {
        sets.push("revenue_real_amount_eur = :revenue_real_amount_eur");
        repl.revenue_real_amount_eur = patch.revenue_real_amount_eur;
      }
    }
    if (patch.label !== undefined) {
      sets.push("revenue_label = :label");
      repl.label = String(patch.label ?? "").slice(0, 512);
    }
    if (patch.customer_name !== undefined) {
      sets.push("customer_name = :customer_name");
      repl.customer_name = String(patch.customer_name ?? "").slice(0, 255);
    }
    if (patch.revenue_real_payment_date !== undefined && patch.revenue_real_payment_date !== null) {
      const ymd = String(patch.revenue_real_payment_date).trim().slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
        sets.push("revenue_real_payment_date = :revenue_real_payment_date");
        repl.revenue_real_payment_date = ymd;
      }
    }
    if (patch.date !== undefined && patch.date !== null) {
      const ymd = String(patch.date).trim().slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
        sets.push("revenue_expected_payment_date = :revenue_expected_payment_date");
        repl.revenue_expected_payment_date = ymd;
      }
    }
    if (sets.length === 0) {
      const err = new Error("No updatable fields provided");
      err.statusCode = 400;
      throw err;
    }
    const [rows] = await sequelize.query(
      `UPDATE revenues_db SET ${sets.join(", ")} WHERE revenue_id = :id RETURNING revenue_id AS id, revenue_label AS label, revenue_reference AS reference, revenue_expected_amount_eur AS amount_eur, revenue_real_amount_eur, revenue_expected_payment_date AS revenue_date, revenue_real_payment_date, customer_name`,
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
    const expectedAmt =
      patch.payment_expected_amount_eur !== undefined &&
      patch.payment_expected_amount_eur !== null
        ? patch.payment_expected_amount_eur
        : patch.amount_eur;
    if (expectedAmt !== undefined && expectedAmt !== null) {
      sets.push("payment_expected_amount_eur = :expected_amount_eur");
      repl.expected_amount_eur = expectedAmt;
    }
    if (patch.payment_real_amount_eur !== undefined) {
      if (patch.payment_real_amount_eur === null || patch.payment_real_amount_eur === "") {
        sets.push("payment_real_amount_eur = NULL");
      } else {
        sets.push("payment_real_amount_eur = :payment_real_amount_eur");
        repl.payment_real_amount_eur = patch.payment_real_amount_eur;
      }
    }
    if (patch.label !== undefined) {
      sets.push("payment_label = :label");
      repl.label = String(patch.label ?? "").slice(0, 512);
    }
    if (patch.provider_name !== undefined) {
      sets.push("payment_provider_name = :payment_provider_name");
      repl.payment_provider_name = String(patch.provider_name ?? "").slice(0, 512);
    }
    const expectedDatePatch =
      patch.payment_expected_date !== undefined && patch.payment_expected_date !== null
        ? patch.payment_expected_date
        : patch.payment_date;
    if (expectedDatePatch !== undefined && expectedDatePatch !== null) {
      const ymd = String(expectedDatePatch).trim().slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
        sets.push("payment_expected_date = :payment_expected_date");
        repl.payment_expected_date = ymd;
      }
    }
    if (patch.payment_real_date !== undefined) {
      if (patch.payment_real_date === null || patch.payment_real_date === "") {
        sets.push("payment_real_date = NULL");
      } else {
        const ymd = String(patch.payment_real_date).trim().slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
          sets.push("payment_real_date = :payment_real_date");
          repl.payment_real_date = ymd;
        }
      }
    }
    if (patch.id_provider !== undefined) {
      const raw = patch.id_provider;
      if (raw === null || raw === "") {
        sets.push("provider_id = NULL");
      } else {
        sets.push("provider_id = :provider_id");
        repl.provider_id = String(raw).trim().slice(0, 64);
      }
    }
    if (sets.length === 0) {
      const err = new Error("No updatable fields provided");
      err.statusCode = 400;
      throw err;
    }
    const [rows] = await sequelize.query(
      `UPDATE payments_db SET ${sets.join(", ")} WHERE payment_id = :id RETURNING payment_id AS id, payment_label AS label, payment_reference AS reference, payment_expected_amount_eur AS amount_eur, payment_real_amount_eur, payment_expected_date AS payment_date, payment_real_date, provider_id AS id_provider, payment_provider_name AS provider_name`,
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

