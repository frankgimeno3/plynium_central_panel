import ContactCommentDbModel from "./ContactCommentDbModel.js";
import "../../database/models.js";

function toApiComment(row) {
  if (!row) return null;
  const plain = typeof row.get === "function" ? row.get({ plain: true }) : row;
  return {
    contact_comment_id: plain.contact_comment_id,
    contact_id: plain.contact_id,
    agent_id: plain.agent_id ?? null,
    contact_comment_content: plain.contact_comment_content ?? "",
    contact_comment_created_at: plain.contact_comment_created_at ?? null,
    contact_comment_updated_at: plain.contact_comment_updated_at ?? null,
  };
}

export async function getCommentsByContactId(contactId) {
  if (!ContactCommentDbModel.sequelize) return [];
  const rows = await ContactCommentDbModel.findAll({
    where: { contact_id: contactId },
    order: [["contact_comment_created_at", "DESC"]],
  });
  return rows.map(toApiComment);
}

export async function createContactComment(contactId, { agent_id = null, contact_comment_content }) {
  if (!ContactCommentDbModel.sequelize) throw new Error("ContactCommentDbModel not initialized");
  const content = String(contact_comment_content ?? "").trim();
  if (!content) throw new Error("contact_comment_content is required");
  const row = await ContactCommentDbModel.create({
    contact_id: contactId,
    agent_id: agent_id ? String(agent_id) : null,
    contact_comment_content: content,
  });
  return toApiComment(row);
}

