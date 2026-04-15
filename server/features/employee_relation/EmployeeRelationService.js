import Database from "../../database/database.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function tableExists(sequelize, tableName) {
  const rows = await sequelize.query(
    "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = :t LIMIT 1",
    { replacements: { t: tableName }, type: sequelize.QueryTypes.SELECT }
  );
  return Array.isArray(rows) && rows.length > 0;
}

function normalizeStatus(status) {
  const s = String(status ?? "").trim().toLowerCase();
  if (!s) return null;
  if (s === "active" || s === "inactive" || s === "pending" || s === "ended") return s;
  return String(status);
}

export async function getEmployeeRelations({ companyId, userId, status } = {}) {
  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  const hasUsersDb = await tableExists(sequelize, "users_db");
  const hasCompaniesDb = await tableExists(sequelize, "companies_db");

  const where = [];
  const replacements = {};
  if (companyId) {
    where.push("er.employee_company_id = :companyId");
    replacements.companyId = String(companyId);
  }
  if (userId) {
    where.push("er.employee_user_id = :userId");
    replacements.userId = String(userId);
  }
  const st = normalizeStatus(status);
  if (st) {
    where.push("er.employee_rel_status = :status");
    replacements.status = st;
  }

  const joins = [];
  const selects = ["er.*"];
  if (hasUsersDb) {
    joins.push("LEFT JOIN public.users_db u ON u.user_id = er.employee_user_id");
    selects.push(
      "concat_ws(' ', u.user_name, u.user_surnames) AS user_full_name",
      "u.user_email AS user_email"
    );
  }
  if (hasCompaniesDb) {
    joins.push("LEFT JOIN public.companies_db c ON c.company_id = er.employee_company_id");
    selects.push("c.company_commercial_name AS company_commercial_name");
  }

  const sql = `
    SELECT ${selects.join(", ")}
    FROM public.employee_relations er
    ${joins.join("\n")}
    ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY er.employee_rel_start_date DESC, er.employee_rel_id DESC
  `;

  const [rows] = await sequelize.query(sql, { replacements });
  return Array.isArray(rows) ? rows : [];
}

export async function createEmployeeRelation({ userId, companyId, role } = {}) {
  if (!userId || !companyId) {
    throw new Error("Missing userId or companyId");
  }
  if (!UUID_REGEX.test(String(userId))) {
    throw new Error("userId must be a UUID (users_db.user_id)");
  }
  const employeeRole = String(role ?? "employee").trim() || "employee";

  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  // Idempotencia lógica: si ya existe una relación activa equivalente, devolverla
  const [existing] = await sequelize.query(
    `
      SELECT *
      FROM public.employee_relations
      WHERE employee_user_id = :userId
        AND employee_company_id = :companyId
        AND employee_role = :role
        AND employee_rel_status = 'active'
      ORDER BY employee_rel_start_date DESC
      LIMIT 1
    `,
    { replacements: { userId: String(userId), companyId: String(companyId), role: employeeRole } }
  );
  if (Array.isArray(existing) && existing.length > 0) return existing[0];

  const [created] = await sequelize.query(
    `
      INSERT INTO public.employee_relations (
        employee_user_id,
        employee_company_id,
        employee_role,
        employee_rel_status,
        employee_rel_start_date,
        employee_rel_end_date
      ) VALUES (
        :userId,
        :companyId,
        :role,
        'active',
        CURRENT_DATE,
        NULL
      )
      RETURNING *
    `,
    { replacements: { userId: String(userId), companyId: String(companyId), role: employeeRole } }
  );
  return Array.isArray(created) && created.length > 0 ? created[0] : null;
}

export async function endEmployeeRelation({ employeeRelId } = {}) {
  if (!employeeRelId) throw new Error("Missing employeeRelId");
  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  const [updated] = await sequelize.query(
    `
      UPDATE public.employee_relations
      SET employee_rel_status = 'inactive',
          employee_rel_end_date = COALESCE(employee_rel_end_date, CURRENT_DATE)
      WHERE employee_rel_id = :id
      RETURNING *
    `,
    { replacements: { id: String(employeeRelId) } }
  );
  return Array.isArray(updated) && updated.length > 0 ? updated[0] : null;
}

