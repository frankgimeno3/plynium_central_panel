import MagazineDbModel from "../features/magazine_db/MagazineDbModel.js";
import MagazineIssueDbModel from "../features/magazine_db/MagazineIssueDbModel.js";
import NotificationDbModel from "../features/notification_db/NotificationDbModel.js";
import NotificationCommentDbModel from "../features/notification_db/NotificationCommentDbModel.js";
import NotificationCompanyContentDbModel from "../features/notification_db/NotificationCompanyContentDbModel.js";

let associationsAlreadyDefined = false;

export function defineAssociations() {
    if (associationsAlreadyDefined) return;
    associationsAlreadyDefined = true;

    MagazineDbModel.hasMany(MagazineIssueDbModel, { foreignKey: "id_magazine" });
    MagazineIssueDbModel.belongsTo(MagazineDbModel, { foreignKey: "id_magazine" });

    NotificationDbModel.hasMany(NotificationCommentDbModel, { foreignKey: "notification_id", as: "comments", onDelete: "CASCADE" });
    NotificationCommentDbModel.belongsTo(NotificationDbModel, { foreignKey: "notification_id" });

    NotificationDbModel.hasOne(NotificationCompanyContentDbModel, { foreignKey: "notification_id", as: "company_content", onDelete: "CASCADE" });
    NotificationCompanyContentDbModel.belongsTo(NotificationDbModel, { foreignKey: "notification_id" });
}