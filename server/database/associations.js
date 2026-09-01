import NotificationDbModel from "../features/notification_db/NotificationDbModel.js";
import NotificationCommentDbModel from "../features/notification_db/NotificationCommentDbModel.js";
import NotificationCompanyContentDbModel from "../features/notification_db/NotificationCompanyContentDbModel.js";
import NotificationAdvertisementDbModel from "../features/notification_db/NotificationAdvertisementDbModel.js";
import ServiceDbModel from "../features/service_db/ServiceDbModel.js";

let associationsAlreadyDefined = false;

export function defineAssociations() {
    if (associationsAlreadyDefined) return;
    associationsAlreadyDefined = true;

    NotificationDbModel.hasMany(NotificationCommentDbModel, { foreignKey: "panel_ticket_id", as: "comments", onDelete: "CASCADE" });
    NotificationCommentDbModel.belongsTo(NotificationDbModel, { foreignKey: "panel_ticket_id" });

    NotificationDbModel.hasOne(NotificationCompanyContentDbModel, { foreignKey: "ticket_id", sourceKey: "panel_ticket_id", as: "company_content", onDelete: "CASCADE" });
    NotificationCompanyContentDbModel.belongsTo(NotificationDbModel, { foreignKey: "ticket_id", targetKey: "panel_ticket_id" });

    NotificationDbModel.hasOne(NotificationAdvertisementDbModel, { foreignKey: "ticket_id", sourceKey: "panel_ticket_id", as: "advertisement_request", onDelete: "CASCADE" });
    NotificationAdvertisementDbModel.belongsTo(NotificationDbModel, { foreignKey: "ticket_id", targetKey: "panel_ticket_id" });

    ServiceDbModel.belongsTo(ServiceDbModel, {
        foreignKey: "related_to_other_services",
        targetKey: "service_id",
        as: "parent_service",
    });
    ServiceDbModel.hasMany(ServiceDbModel, {
        foreignKey: "related_to_other_services",
        sourceKey: "service_id",
        as: "related_services",
    });
}
