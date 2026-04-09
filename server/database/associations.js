import NotificationDbModel from "../features/notification_db/NotificationDbModel.js";
import NotificationCommentDbModel from "../features/notification_db/NotificationCommentDbModel.js";
import NotificationCompanyContentDbModel from "../features/notification_db/NotificationCompanyContentDbModel.js";

let associationsAlreadyDefined = false;

export function defineAssociations() {
    if (associationsAlreadyDefined) return;
    associationsAlreadyDefined = true;

    NotificationDbModel.hasMany(NotificationCommentDbModel, { foreignKey: "panel_ticket_id", as: "comments", onDelete: "CASCADE" });
    NotificationCommentDbModel.belongsTo(NotificationDbModel, { foreignKey: "panel_ticket_id" });

    NotificationDbModel.hasOne(NotificationCompanyContentDbModel, { foreignKey: "ticket_id", sourceKey: "panel_ticket_id", as: "company_content", onDelete: "CASCADE" });
    NotificationCompanyContentDbModel.belongsTo(NotificationDbModel, { foreignKey: "ticket_id", targetKey: "panel_ticket_id" });
}
