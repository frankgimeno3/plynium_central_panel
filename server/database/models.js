import {DataTypes} from "sequelize";
import Database from "./database.js";
import ArticleModel from "../features/article/ArticleModel.js";
import ContentModel from "../features/content/ContentModel.js";
import PublicationModel from "../features/publication/PublicationModel.js";
import EventModel from "../features/event/EventModel.js";
import CompanyModel from "../features/company/CompanyModel.js";
import ProductModel from "../features/product/ProductModel.js";
import BannerModel from "../features/banner/BannerModel.js";
import FolderModel from "../features/folder/FolderModel.js";
import MediaModel from "../features/media/MediaModel.js";
import {defineAssociations} from "./associations.js";

const database = Database.getInstance();
const sequelize = database.isConfigured() ? database.getSequelize() : null;

if (sequelize) {
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
    },
    portal_id: {
        type: DataTypes.INTEGER,
        allowNull: true
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
    article_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: 'article', key: 'id_article' }
    },
    position: {
        type: DataTypes.INTEGER,
        allowNull: false
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
        {fields: ['content_type']},
        {fields: ['article_id', 'position']}
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
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
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
    portal_id: {
        type: DataTypes.INTEGER,
        allowNull: true
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
    },
    appearance_weight: {
        type: DataTypes.STRING(16),
        allowNull: true
    }
}, {
    sequelize,
    modelName: "banner",
    underscored: true,
    tableName: "banners",
    indexes: [
        { fields: ["portal_id"] },
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
    },
    id_customer: {
        type: DataTypes.STRING,
        allowNull: true
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

FolderModel.init({
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    parent_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "folders", key: "id" }
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    modelName: "folder",
    underscored: true,
    tableName: "folders",
    indexes: [{ fields: ["parent_id"] }]
});

MediaModel.init({
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    folder_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "folders", key: "id" }
    },
    content_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    s3_key: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true
    },
    content_src: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    mime_type: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    type: {
        type: DataTypes.ENUM("pdf", "image"),
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    modelName: "media_content",
    underscored: true,
    tableName: "media_contents",
    indexes: [
        { fields: ["folder_id"] },
        { fields: ["type"] },
        { fields: ["created_at"] }
    ]
});

defineAssociations();
}

export { ArticleModel, ContentModel, PublicationModel, EventModel, CompanyModel, ProductModel, BannerModel, FolderModel, MediaModel };

