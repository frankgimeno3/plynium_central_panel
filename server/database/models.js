import {DataTypes} from "sequelize";
import {TimeLogTypeEnum} from "../features/timeLog/TimeLogTypeEnum.js";
import TimeLogModel from "../features/timeLog/TimeLogModel.js";
import Database from "./database.js";
import {ModificationStatusEnum} from "../features/modification/ModificationStatusEnum.js";
import ModificationModel from "../features/modification/ModificationModel.js";
import ArticleModel from "../features/article/ArticleModel.js";
import ContentModel from "../features/content/ContentModel.js";
import PublicationModel from "../features/publication/PublicationModel.js";
import EventModel from "../features/event/EventModel.js";
import CompanyModel from "../features/company/CompanyModel.js";
import ProductModel from "../features/product/ProductModel.js";
import BannerModel from "../features/banner/BannerModel.js";
import {defineAssociations} from "./associations.js";

const database = Database.getInstance();
const sequelize = database.isConfigured() ? database.getSequelize() : null;

if (sequelize) {
TimeLogModel.init({
    id: {type: DataTypes.BIGINT, primaryKey: true, unique: true, autoIncrement: true},
    createdBy: {type: DataTypes.STRING, allowNull: false},
    ip: {type: DataTypes.STRING},
    type: {type: DataTypes.ENUM(...Object.values(TimeLogTypeEnum)), allowNull: false},
    date: {type: DataTypes.DATE, allowNull: false},
    comment: {type: DataTypes.TEXT},
}, {
    sequelize,
    modelName: 'timeLog',
    underscored: true,
    indexes: [
        {fields: ['created_by']},
        {fields: ['type']},
        {fields: ['created_at']}
    ]
});

ModificationModel.init({
    id: {type: DataTypes.BIGINT, primaryKey: true, unique: true, autoIncrement: true},
    timeLogId: {type: DataTypes.BIGINT, allowNull: false},
    status: {type: DataTypes.ENUM(...Object.values(ModificationStatusEnum)), allowNull: false},
    oldType: {type: DataTypes.ENUM(...Object.values(TimeLogTypeEnum)), allowNull: false},
    newType: {type: DataTypes.ENUM(...Object.values(TimeLogTypeEnum)), allowNull: false},
    oldDate: {type: DataTypes.DATE},
    newDate: {type: DataTypes.DATE},
    comment: {type: DataTypes.TEXT},
    createdBy: {type: DataTypes.STRING, allowNull: false},
    reviewedBy: {type: DataTypes.STRING},
    reviewedAt: {type: DataTypes.DATE},
}, {
    sequelize,
    modelName: 'modification',
    underscored: true,
    indexes: [
        { fields: ['time_log_id'] },
        { fields: ['created_by'] },
        { fields: ['reviewed_by'] },
        { fields: ['status'] },
        { fields: ['reviewed_at'] },
    ]
});

ArticleModel.init({
    id_article: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true
    },
    article_title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    article_subtitle: {
        type: DataTypes.STRING
    },
    article_main_image_url: {
        type: DataTypes.STRING
    },
    company: {
        type: DataTypes.STRING
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    article_tags_array: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    contents_array: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    highlited_position: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
    },
    is_article_event: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    event_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
    }
}, {
    sequelize,
    modelName: 'article',
    underscored: true,
    indexes: [
        {fields: ['article_title']},
        {fields: ['date']},
        {fields: ['company']}
    ]
});

ContentModel.init({
    content_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true
    },
    content_type: {
        type: DataTypes.ENUM('text_image', 'image_text', 'just_image', 'just_text'),
        allowNull: false
    },
    content_content: {
        type: DataTypes.JSONB,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'content',
    underscored: true,
    indexes: [
        {fields: ['content_type']}
    ]
});

PublicationModel.init({
    id_publication: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true
    },
    redirection_link: {
        type: DataTypes.STRING,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    revista: {
        type: DataTypes.STRING,
        allowNull: false
    },
    número: {
        type: DataTypes.STRING,
        allowNull: false
    },
    publication_main_image_url: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'publication',
    underscored: true,
    indexes: [
        {fields: ['date']},
        {fields: ['revista']}
    ]
});

CompanyModel.init({
    company_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true
    },
    commercial_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
    },
    main_description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ""
    },
    main_image: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
    },
    products_array: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    categories_array: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    main_email: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
    },
    mail_telephone: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
    },
    full_address: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
    },
    web_link: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
    }
}, {
    sequelize,
    modelName: "company",
    underscored: true,
    tableName: "companies",
    indexes: [
        { fields: ["commercial_name"] },
        { fields: ["country"] },
        { fields: ["category"] }
    ]
});

ProductModel.init({
    product_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true
    },
    product_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    company: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
    },
    product_description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ""
    },
    main_image_src: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
    },
    product_categories_array: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    }
}, {
    sequelize,
    modelName: "product",
    underscored: true,
    tableName: "products",
    indexes: [
        { fields: ["product_name"] },
        { fields: ["company"] }
    ]
});

BannerModel.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true
    },
    src: {
        type: DataTypes.STRING(2048),
        allowNull: false
    },
    route: {
        type: DataTypes.STRING(512),
        allowNull: false,
        defaultValue: "/"
    },
    banner_redirection: {
        type: DataTypes.STRING(2048),
        allowNull: false,
        defaultValue: "https://www.vidrioperfil.com"
    },
    position_type: {
        type: DataTypes.ENUM("right", "top", "medium"),
        allowNull: false
    },
    page_type: {
        type: DataTypes.ENUM("home", "custom"),
        allowNull: false
    },
    position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    sequelize,
    modelName: "banner",
    underscored: true,
    tableName: "banners",
    indexes: [
        { fields: ["page_type"] },
        { fields: ["position_type"] },
        { fields: ["route"] }
    ]
});

EventModel.init({
    id_fair: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true
    },
    event_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
    },
    main_description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ""
    },
    region: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
    },
    event_main_image: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
    }
}, {
    sequelize,
    modelName: 'event',
    underscored: true,
    indexes: [
        {fields: ['start_date']},
        {fields: ['region']}
    ]
});

defineAssociations();
}

export { TimeLogModel, ModificationModel, ArticleModel, ContentModel, PublicationModel, EventModel, CompanyModel, ProductModel, BannerModel };