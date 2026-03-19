import ContractDbModel from "./ContractDbModel.js";
import "../../database/models.js";

function toApiContract(row) {
  if (!row) return null;
  return {
    id_contract: row.id_contract,
    id_proposal: row.id_proposal ?? "",
    id_customer: row.id_customer ?? "",
    agent: row.agent ?? "",
    process_state: row.process_state ?? "",
    payment_state: row.payment_state ?? "",
    title: row.title ?? "",
    amount_eur: row.amount_eur != null ? Number(row.amount_eur) : 0,
  };
}

export async function getAllContracts() {
  try {
    if (!ContractDbModel.sequelize) {
      console.warn("ContractDbModel not initialized, returning empty array");
      return [];
    }
    const rows = await ContractDbModel.findAll({
      order: [["id_contract", "DESC"]],
    });
    return rows.map((r) => toApiContract(r.get({ plain: true })));
  } catch (error) {
    console.error("Error fetching contracts from database:", error);
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

export async function getContractById(idContract) {
  const row = await ContractDbModel.findByPk(idContract);
  if (!row) throw new Error(`Contract with id ${idContract} not found`);
  return toApiContract(row.get({ plain: true }));
}

