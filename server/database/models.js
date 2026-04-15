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
import CompanyCategoryModel from "../features/company_category/CompanyCategoryModel.js";
import TopicDbModel from "../features/topic_db/TopicDbModel.js";
import CustomerDbModel from "../features/customer_db/CustomerDbModel.js";
import ContactDbModel from "../features/contact_db/ContactDbModel.js";
import ContactCommentDbModel from "../features/contact_comment_db/ContactCommentDbModel.js";
import CustomerCommentDbModel from "../features/customer_comment_db/CustomerCommentDbModel.js";
import AgentDbModel from "../features/agent_db/AgentDbModel.js";
import MagazineDbModel from "../features/magazine_db/MagazineDbModel.js";
import ProviderDbModel from "../features/provider_db/ProviderDbModel.js";
import ProviderInvoiceDbModel from "../features/provider_db/ProviderInvoiceDbModel.js";
import ProposalDbModel from "../features/proposal_db/ProposalDbModel.js";
import ProposalServiceLineDbModel from "../features/proposal_db/ProposalServiceLineDbModel.js";
import ProposalPaymentDbModel from "../features/proposal_db/ProposalPaymentDbModel.js";
import ContractDbModel from "../features/contract_db/ContractDbModel.js";
import ProjectDbModel from "../features/project_db/ProjectDbModel.js";
import PmEventDbModel from "../features/pm_event_db/PmEventDbModel.js";
import IssuedInvoiceDbModel from "../features/billing_db/IssuedInvoiceDbModel.js";
import OrderDbModel from "../features/billing_db/OrderDbModel.js";
import ServiceDbModel from "../features/service_db/ServiceDbModel.js";
import NotificationDbModel from "../features/notification_db/NotificationDbModel.js";
import NotificationCommentDbModel from "../features/notification_db/NotificationCommentDbModel.js";
import NotificationCompanyContentDbModel from "../features/notification_db/NotificationCompanyContentDbModel.js";
import PublicationSlotDbModel from "../features/publication_workflow/PublicationSlotDbModel.js";
import PublicationSlotContentDbModel from "../features/publication_workflow/PublicationSlotContentDbModel.js";
import OfferedPreferentialPageDbModel from "../features/publication_workflow/OfferedPreferentialPageDbModel.js";
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
    article_company_names_array: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false,
        defaultValue: []
    },
    article_company_id_array: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false,
        defaultValue: []
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "article_date"
    },
    highlited_position: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        field: "article_highlited_position"
    },
    is_article_event: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    event_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        field: "article_event_id"
    },
    topic_ids_array: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: false,
        defaultValue: []
    }
}, {
    sequelize,
    modelName: "article",
    tableName: "articles_db",
    underscored: true,
    timestamps: true,
    createdAt: "article_created_at",
    updatedAt: "article_updated_at",
    indexes: [
        { fields: ["article_title"] },
        { fields: ["date"] }
    ]
});

ContentModel.init({
    content_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
        field: "article_content_id",
    },
    article_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: 'article', key: 'id_article' }
    },
    position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "article_content_position",
    },
    content_type: {
        type: DataTypes.ENUM('text_image', 'image_text', 'just_image', 'just_text'),
        allowNull: false,
        field: "article_content_type",
    },
    content_content: {
        type: DataTypes.JSONB,
        allowNull: false
        ,
        field: "article_content_content",
    }
}, {
    sequelize,
    modelName: 'content',
    tableName: "article_contents",
    underscored: true,
    timestamps: true,
    createdAt: "article_created_at",
    updatedAt: "article_updated_at",
    indexes: [
        {fields: ['content_type']},
        {fields: ['article_id', 'position']}
    ]
});

PublicationModel.init({
    publication_id: {
        type: DataTypes.STRING(255),
        primaryKey: true,
        unique: true
    },
    magazine_id: { type: DataTypes.STRING(255), allowNull: true },
    magazine_general_issue_number: { type: DataTypes.INTEGER, allowNull: true },
    publication_year: { type: DataTypes.INTEGER, allowNull: true },
    magazine_this_year_issue: { type: DataTypes.INTEGER, allowNull: true },
    publication_expected_publication_month: { type: DataTypes.SMALLINT, allowNull: true },
    real_publication_month_date: { type: DataTypes.DATEONLY, allowNull: true },
    publication_materials_deadline: { type: DataTypes.DATEONLY, allowNull: true },
    publication_main_image_url: { type: DataTypes.STRING(512), allowNull: true },
    publication_edition_name: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "" },
    is_special_edition: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    publication_theme: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "" },
    publication_status: { type: DataTypes.STRING(64), allowNull: false, defaultValue: "draft" },
    publication_format: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "flipbook" }
}, {
    sequelize,
    modelName: 'publication',
    underscored: true,
    tableName: "publications_db",
    // publications_db does not have created_at/updated_at columns
    timestamps: false,
    indexes: [
        { fields: ["magazine_id"] },
        { fields: ["publication_year"] },
        { fields: ["publication_status"] },
        { fields: ["real_publication_month_date"] }
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
        allowNull: false,
        field: "company_commercial_name"
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        field: "company_country"
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        field: "company_category"
    },
    main_description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
        field: "company_main_description"
    },
    main_image: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        field: "company_main_image"
    },
    mail_telephone: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        field: "company_main_telephone"
    },
    full_address: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        field: "company_full_address"
    },
    web_link: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        field: "company_web_link"
    },
    employee_relations_array: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false,
        defaultValue: [],
        field: "company_employee_relations_array"
    }
}, {
    sequelize,
    modelName: "company",
    underscored: true,
    tableName: "companies_db",
    timestamps: true,
    createdAt: "company_created_at",
    updatedAt: "company_updated_at",
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
    product_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    company_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
    },
    product_description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ""
    },
    product_main_image_src: {
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
    tableName: "products_db",
    timestamps: true,
    createdAt: "product_created_at",
    updatedAt: "product_updated_at",
    indexes: [
        { fields: ["product_name"] },
        { fields: ["company_id"] }
    ]
});

BannerModel.init({
    bannerId: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
        field: "id_banner"
    },
    bannerPortalId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "portal_id"
    },
    bannerImageSrc: {
        type: DataTypes.STRING(2048),
        allowNull: false,
        field: "banner_image_src"
    },
    bannerRoute: {
        type: DataTypes.STRING(512),
        allowNull: false,
        defaultValue: "/",
        field: "banner_route"
    },
    bannerRedirectionUrl: {
        type: DataTypes.STRING(2048),
        allowNull: false,
        defaultValue: "https://www.vidrioperfil.com",
        field: "banner_redirection_url"
    },
    bannerPositionType: {
        type: DataTypes.ENUM("right", "top", "medium"),
        allowNull: false,
        field: "banner_position_type"
    },
    bannerPageType: {
        type: DataTypes.ENUM("home", "custom"),
        allowNull: false,
        field: "banner_page_type"
    },
    bannerPosition: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "banner_position"
    },
    bannerAppearenceWeight: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2,
        field: "banner_appearence_weight"
    },
    bannerStartsAt: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "banner_starting_date"
    },
    bannerEndsAt: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "banner_ending_date"
    },
    bannerStatus: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: "published",
        field: "banner_status"
    }
}, {
    sequelize,
    modelName: "banner",
    underscored: false,
    tableName: "portal_banners",
    timestamps: true,
    createdAt: "banner_created_at",
    updatedAt: "banner_updated_at",
    indexes: [
        { fields: ["bannerPortalId"] },
        { fields: ["bannerPageType"] },
        { fields: ["bannerPositionType"] },
        { fields: ["bannerRoute"] }
    ]
});

EventModel.init({
    id_fair: { type: DataTypes.STRING, primaryKey: true, unique: true, field: "event_id" },
    event_name: { type: DataTypes.STRING, allowNull: false, field: "event_name" },
    country: { type: DataTypes.STRING, allowNull: true, defaultValue: "", field: "event_country" },
    location: { type: DataTypes.STRING, allowNull: true, defaultValue: "", field: "event_location" },
    main_description: { type: DataTypes.TEXT, allowNull: true, defaultValue: "", field: "event_main_description" },
    region: { type: DataTypes.STRING, allowNull: true, defaultValue: "", field: "event_region" },
    start_date: { type: DataTypes.DATEONLY, allowNull: false, field: "event_start_date" },
    end_date: { type: DataTypes.DATEONLY, allowNull: false, field: "event_end_date" },
    event_main_image: { type: DataTypes.STRING, allowNull: true, defaultValue: "", field: "event_main_image_src" },
    id_customer: { type: DataTypes.STRING, allowNull: true, field: "customer_id" }
}, {
    sequelize,
    modelName: 'event',
    underscored: true,
    tableName: "events",
    timestamps: true,
    createdAt: "event_created_at",
    updatedAt: "event_updated_at",
    indexes: [
        {fields: ['event_start_date']},
        {fields: ['event_region']}
    ]
});

FolderModel.init({
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        field: "mediateca_folder_id"
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "mediateca_folder_name"
    },
    parent_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "folder", key: "id" },
        field: "mediateca_parent_folder_id"
    }
}, {
    sequelize,
    modelName: "folder",
    underscored: true,
    tableName: "mediateca_folders",
    timestamps: true,
    createdAt: "mediateca_folder_created_at",
    updatedAt: "mediateca_folder_updated_at",
    indexes: [{ fields: ["parent_id"] }]
});

MediaModel.init({
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        field: "mediateca_content_id"
    },
    folder_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "folder", key: "id" },
        field: "mediateca_folder_id"
    },
    content_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "mediateca_content_name"
    },
    s3_key: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
        field: "mediateca_s3_key"
    },
    content_src: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "mediateca_content_src"
    },
    mime_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "content_mime_type"
    },
    type: {
        type: DataTypes.ENUM("pdf", "image"),
        allowNull: false,
        field: "mediateca_content_type"
    }
}, {
    sequelize,
    modelName: "media_content",
    underscored: true,
    tableName: "mediateca_media_contents",
    timestamps: true,
    createdAt: "mediateca_content_created_at",
    updatedAt: "mediateca_content_updated_at",
    indexes: [
        { fields: ["folder_id"] },
        { fields: ["type"] },
        { fields: ["created_at"] }
    ]
});

CompanyCategoryModel.init({
    id_category: {
        type: DataTypes.STRING(32),
        primaryKey: true,
        unique: true
        ,
        field: "category_id"
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
        ,
        field: "category_name"
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ""
        ,
        field: "category_description"
    },
}, {
    sequelize,
    modelName: "company_category",
    underscored: true,
    tableName: "company_categories",
    timestamps: true,
    createdAt: "category_created_at",
    updatedAt: "category_updated_at",
    indexes: [
        { fields: ["name"] }
    ]
});

TopicDbModel.init({
    topic_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    topic_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    topic_description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
    }
}, {
    sequelize,
    modelName: "topic_db",
    underscored: true,
    tableName: "topics_db",
    timestamps: true,
    createdAt: "topic_created_at",
    updatedAt: "topic_updated_at",
    indexes: [
        { fields: ["topic_name"] },
        // Nota: antes era unique por (topic_portal, topic_name).
        // Con topic_portals (many-to-many) no se puede expresar sin desnormalizar.
    ]
});

CustomerDbModel.init({
    id_customer: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        unique: true,
        field: "customer_id"
    },
    name: { type: DataTypes.STRING(512), allowNull: false, field: "customer_account_name" },
    cif: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "", field: "customer_tax_id" },
    country: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "", field: "customer_country" },
    address: { type: DataTypes.TEXT, allowNull: true, defaultValue: "", field: "customer_full_address" },
    phone: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "", field: "customer_main_phone" },
    email: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "", field: "customer_main_email" },
    website: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "", field: "customer_website" },
    industry: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "", field: "customer_industry" },
    owner: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "", field: "customer_agent_id" },
    status: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "active", field: "customer_status" },
    tags: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true, defaultValue: [], field: "customer_tags" },
    related_accounts: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true, defaultValue: [], field: "customer_related_accounts" },
    customer_company_id_array: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true, defaultValue: [], field: "customer_company_id_array" },
    customer_product_id_array: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true, defaultValue: [], field: "customer_product_id_array" }
}, {
    sequelize,
    modelName: "customer_db",
    underscored: true,
    tableName: "customers_db",
    timestamps: true,
    createdAt: "customer_created_at",
    updatedAt: "customer_updated_at",
    indexes: [
        { fields: ["customer_account_name"] },
        { fields: ["customer_country"] },
        { fields: ["customer_status"] },
        { fields: ["customer_agent_id"] }
    ]
});

CustomerCommentDbModel.init({
    customer_comment_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4, field: "customer_comment_id" },
    customer_id: { type: DataTypes.STRING(255), allowNull: false, field: "customer_id" },
    agent_id: { type: DataTypes.STRING(255), allowNull: true, field: "agent_id" }
}, {
    sequelize,
    modelName: "customer_comment_db",
    underscored: true,
    tableName: "customer_comments",
    timestamps: true,
    createdAt: "customer_comment_created_at",
    updatedAt: "customer_comment_updated_at",
    indexes: [
        { fields: ["customer_id"] },
        { fields: ["agent_id"] }
    ]
});

ContactDbModel.init({
    id_contact: { type: DataTypes.STRING(64), primaryKey: true, unique: true, field: "contact_id" },
    contact_name: { type: DataTypes.STRING(512), allowNull: false, field: "contact_name" },
    contact_surnames: { type: DataTypes.STRING(512), allowNull: true, defaultValue: "", field: "contact_surnames" },
    role: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "", field: "contact_role" },
    email: { type: DataTypes.STRING(512), allowNull: true, defaultValue: "", field: "contact_email" },
    phone: { type: DataTypes.STRING(128), allowNull: true, defaultValue: "", field: "contact_phone" },
    id_customer: { type: DataTypes.STRING(64), allowNull: true, defaultValue: "", field: "customer_id" },
    company_name: { type: DataTypes.STRING(512), allowNull: true, defaultValue: "", field: "customer_company_name" },
    contact_user_id_array: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true, defaultValue: [], field: "contact_user_id_array" },
    linkedin_profile: { type: DataTypes.STRING(512), allowNull: true, defaultValue: "", field: "contact_linkedin_url" },
    based_in_country: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "", field: "contact_based_in_country" }
}, {
    sequelize,
    modelName: "contact_db",
    underscored: true,
    tableName: "contacts_db",
    indexes: [
        { fields: ["contact_name"] },
        { fields: ["customer_id"] },
        { fields: ["contact_email"] },
        { fields: ["customer_company_name"] }
    ]
    ,
    timestamps: true,
    createdAt: "contact_created_at",
    updatedAt: "contact_updated_at"
});

AgentDbModel.init({
    id_agent: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        unique: true,
        field: "agent_id"
    },
    name: { type: DataTypes.STRING(512), allowNull: false, field: "agent_name" },
    email: { type: DataTypes.STRING(512), allowNull: true, defaultValue: "", field: "agent_email" }
}, {
    sequelize,
    modelName: "agent_db",
    underscored: true,
    tableName: "agents_db",
    indexes: [
        { fields: ["name"] }
    ],
    timestamps: true,
    createdAt: "agent_created_at",
    updatedAt: "agent_updated_at"
});

ContactCommentDbModel.init({
    contact_comment_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4, field: "contact_comment_id" },
    contact_id: { type: DataTypes.STRING(255), allowNull: false, field: "contact_id" },
    agent_id: { type: DataTypes.STRING(255), allowNull: true, field: "agent_id" },
    contact_comment_content: { type: DataTypes.TEXT, allowNull: false, defaultValue: "", field: "contact_comment_content" }
}, {
    sequelize,
    modelName: "contact_comment_db",
    underscored: true,
    tableName: "contact_comments",
    timestamps: true,
    createdAt: "contact_comment_created_at",
    updatedAt: "contact_comment_updated_at",
    indexes: [
        { fields: ["contact_id"] },
        { fields: ["agent_id"] }
    ]
});

MagazineDbModel.init({
    id_magazine: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        unique: true,
        field: "magazine_id"
    },
    name: { type: DataTypes.STRING(512), allowNull: false, field: "magazine_name" },
    description: { type: DataTypes.TEXT, allowNull: true, defaultValue: "", field: "magazine_description" },
    first_year: { type: DataTypes.INTEGER, allowNull: true, field: "magazine_starting_year" },
    periodicity: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "",
        field: "magazine_periodicity"
    },
    subscriber_number: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "magazine_subscriber_number"
    }
}, {
    sequelize,
    modelName: "magazine",
    underscored: true,
    tableName: "magazines_db",
    timestamps: false,
    indexes: [
        { fields: ["name"] },
        { fields: ["first_year"] }
    ]
});

ProviderDbModel.init({
    id_provider: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        unique: true,
        field: "provider_id"
    },
    name: {
        type: DataTypes.STRING(512),
        allowNull: false,
        field: "provider_company_name"
    },
    contact_email: {
        type: DataTypes.STRING(512),
        allowNull: true,
        defaultValue: "",
        field: "provider_contact_email"
    },
    contact_phone: {
        type: DataTypes.STRING(128),
        allowNull: true,
        defaultValue: "",
        field: "provider_contact_phone"
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
        field: "provider_full_address"
    },
    tax_id: {
        type: DataTypes.STRING(64),
        allowNull: true,
        defaultValue: "",
        field: "provider_tax_id"
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
        field: "provider_notes"
    }
}, {
    sequelize,
    modelName: "provider_db",
    underscored: true,
    tableName: "providers_db",
    timestamps: true,
    createdAt: "provider_created_at",
    updatedAt: "provider_updated_at",
    indexes: [
        { fields: ["provider_company_name"] }
    ]
});

ProviderInvoiceDbModel.init({
    id: { type: DataTypes.STRING(64), primaryKey: true, unique: true, field: "provider_invoice_id" },
    id_provider: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: "provider_id",
        references: { model: "providers_db", key: "provider_id" }
    },
    invoice_provider_reference_number: {
        type: DataTypes.STRING(512),
        allowNull: false,
        defaultValue: "",
        field: "invoice_provider_reference_number"
    },
    provider_company_name: {
        type: DataTypes.STRING(512),
        allowNull: false,
        field: "provider_company_name"
    },
    invoice_amount_eur: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
        field: "invoice_amount_eur"
    },
    invoice_issue_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "invoice_issue_date"
    },
    invoice_payment_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "invoice_payment_date"
    }
}, {
    sequelize,
    modelName: "provider_invoice_db",
    underscored: true,
    tableName: "provider_invoices_db",
    timestamps: true,
    createdAt: "invoice_created_at",
    updatedAt: "invoice_updated_at",
    indexes: [
        { fields: ["provider_id"] },
        { fields: ["invoice_payment_date"] }
    ]
});

ProposalDbModel.init({
    id_proposal: { type: DataTypes.STRING(64), primaryKey: true, unique: true, field: "proposal_id" },
    id_customer: { type: DataTypes.STRING(64), allowNull: false, field: "customer_id" },
    id_contact: { type: DataTypes.STRING(64), allowNull: true, defaultValue: "", field: "contact_id" },
    additional_contact_ids: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        defaultValue: [],
        field: "additional_contact_ids_array"
    },
    agent: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "", field: "agent_id" },
    status: { type: DataTypes.STRING(64), allowNull: false, field: "proposal_status" },
    title: { type: DataTypes.STRING(512), allowNull: false, field: "proposal_tittle" },
    amount_eur: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0, field: "proposal_ammount_eur" },
    proposal_date: { type: DataTypes.DATEONLY, allowNull: true, field: "proposal_date" },
    date_created: { type: DataTypes.DATEONLY, allowNull: true, field: "proposal_creation_date" },
    expiration_date: { type: DataTypes.DATEONLY, allowNull: true, field: "proposal_expiration_date" },
    general_discount_pct: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0, field: "proposal_general_discount" },
    is_exchange: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false, field: "is_proposal_exchange" },
    exchange_has_final_price: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    exchange_final_price: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0 },
    exchange_has_bank_transfers: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    exchange_plynium_transfers_array: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false,
        defaultValue: []
    },
    exchange_counterpart_transfers_array: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false,
        defaultValue: []
    }
}, {
    sequelize,
    modelName: "proposal_db",
    underscored: true,
    tableName: "proposals_db",
    timestamps: true,
    createdAt: "proposal_created_at",
    updatedAt: "proposal_updated_at",
    indexes: [
        { fields: ["id_customer"] },
        { fields: ["status"] },
        { fields: ["agent"] },
        { fields: ["date_created"] }
    ]
});

ProposalServiceLineDbModel.init({
    proposal_service_line_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        field: "proposal_service_line_id"
    },
    proposal_id: { type: DataTypes.STRING(255), allowNull: false, field: "proposal_id" },
    service_id: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "", field: "service_id" },
    proposal_service_custom_name: {
        type: DataTypes.STRING(512),
        allowNull: false,
        defaultValue: "",
        field: "proposal_service_custom_name"
    },
    proposal_service_discount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
        field: "proposal_service_discount"
    }
}, {
    sequelize,
    modelName: "proposal_service_line_db",
    underscored: true,
    tableName: "proposal_service_lines",
    timestamps: false,
    indexes: [{ fields: ["proposal_id"] }]
});

ProposalPaymentDbModel.init({
    proposal_payment_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        field: "proposal_payment_id"
    },
    proposal_id: { type: DataTypes.STRING(255), allowNull: false, field: "proposal_id" },
    proposal_payment_amount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
        field: "proposal_payment_amount"
    },
    proposal_payment_date: { type: DataTypes.DATEONLY, allowNull: true, field: "proposal_payment_date" },
    proposal_payment_number: {
        type: DataTypes.STRING(64),
        allowNull: false,
        defaultValue: "",
        field: "proposal_payment_number"
    }
}, {
    sequelize,
    modelName: "proposal_payment_db",
    underscored: true,
    tableName: "proposal_payments",
    timestamps: false,
    indexes: [{ fields: ["proposal_id"] }]
});

ContractDbModel.init({
    id_contract: { type: DataTypes.STRING(64), primaryKey: true, unique: true },
    id_proposal: { type: DataTypes.STRING(64), allowNull: false },
    id_customer: { type: DataTypes.STRING(64), allowNull: false },
    agent: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "" },
    process_state: { type: DataTypes.STRING(64), allowNull: false },
    payment_state: { type: DataTypes.STRING(64), allowNull: false },
    title: { type: DataTypes.STRING(512), allowNull: false },
    amount_eur: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0 }
}, {
    sequelize,
    modelName: "contract_db",
    underscored: true,
    tableName: "contracts_db",
    indexes: [
        { fields: ["id_customer"] },
        { fields: ["id_proposal"] },
        { fields: ["process_state"] },
        { fields: ["payment_state"] },
        { fields: ["agent"] }
    ]
});

ProjectDbModel.init({
    id_project: { type: DataTypes.STRING(64), primaryKey: true, unique: true },
    id_contract: { type: DataTypes.STRING(64), allowNull: false },
    title: { type: DataTypes.STRING(512), allowNull: false },
    status: { type: DataTypes.STRING(64), allowNull: false },
    service: { type: DataTypes.STRING(64), allowNull: false },
    publication_date: { type: DataTypes.DATEONLY, allowNull: true },
    publication_id: { type: DataTypes.STRING(64), allowNull: true },
    pm_events_array: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true, defaultValue: [] }
}, {
    sequelize,
    modelName: "project_db",
    underscored: true,
    tableName: "projects_db",
    indexes: [
        { fields: ["id_contract"] },
        { fields: ["status"] },
        { fields: ["service"] },
        { fields: ["publication_date"] }
    ]
});

PmEventDbModel.init({
    // Map API-friendly names to canonical RDS columns (pm_events_db)
    id_event: { type: DataTypes.STRING(64), primaryKey: true, unique: true, field: "pm_event_id" },
    id_project: { type: DataTypes.STRING(64), allowNull: false, field: "project_id" },
    id_customer: { type: DataTypes.STRING(64), allowNull: false, field: "customer_id" },
    event_type: { type: DataTypes.STRING(64), allowNull: false, field: "pm_event_type" },
    date: { type: DataTypes.DATEONLY, allowNull: false, field: "pm_event_date" },
    event_description: { type: DataTypes.TEXT, allowNull: false, defaultValue: "", field: "pm_event_description" },
    event_state: { type: DataTypes.STRING(64), allowNull: false, defaultValue: "pending", field: "pm_event_state" }
}, {
    sequelize,
    modelName: "pm_event_db",
    underscored: true,
    tableName: "pm_events_db",
    timestamps: true,
    createdAt: "pm_event_created_at",
    updatedAt: "pm_event_updated_at",
    indexes: [
        { fields: ["project_id"] },
        { fields: ["customer_id"] },
        { fields: ["pm_event_type"] },
        { fields: ["pm_event_date"] },
        { fields: ["pm_event_state"] }
    ]
});

IssuedInvoiceDbModel.init({
    invoice_id: { type: DataTypes.STRING(64), primaryKey: true, unique: true },
    contract_id: { type: DataTypes.STRING(64), allowNull: true, field: "contract_id" },
    customer_id: { type: DataTypes.STRING(64), allowNull: false, field: "customer_id" },
    customer_company: { type: DataTypes.STRING(512), allowNull: false, field: "customer_company" },
    agent_id: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "", field: "agent_id" },
    invoice_amount_eur: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, field: "invoice_amount_eur" },
    invoice_issue_date: { type: DataTypes.DATEONLY, allowNull: false, field: "invoice_issue_date" },
    invoice_payment_date: { type: DataTypes.DATEONLY, allowNull: true, field: "invoice_payment_date" },
    invoice_state: { type: DataTypes.STRING(64), allowNull: true, defaultValue: "", field: "invoice_state" }
}, {
    sequelize,
    modelName: "issued_invoice_db",
    underscored: true,
    tableName: "issued_invoices_db",
    timestamps: true,
    createdAt: "invoice_created_at",
    updatedAt: "invoice_updated_at",
    indexes: [
        { fields: ["contract_id"] },
        { fields: ["customer_id"] },
        { fields: ["invoice_issue_date"] },
        { fields: ["invoice_payment_date"] },
        { fields: ["invoice_state"] }
    ]
});

OrderDbModel.init({
    order_code: { type: DataTypes.STRING(64), primaryKey: true, unique: true },
    invoice_id: { type: DataTypes.STRING(64), allowNull: false, references: { model: "issued_invoices_db", key: "invoice_id" } },
    id_contract: { type: DataTypes.STRING(64), allowNull: true },
    contract_code: { type: DataTypes.STRING(64), allowNull: true },
    client_id: { type: DataTypes.STRING(64), allowNull: true },
    client_name: { type: DataTypes.STRING(512), allowNull: true },
    agent: { type: DataTypes.STRING(255), allowNull: true },
    id_contact: { type: DataTypes.STRING(64), allowNull: true },
    collection_date: { type: DataTypes.DATEONLY, allowNull: false },
    payment_status: { type: DataTypes.STRING(64), allowNull: false },
    amount_eur: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 }
}, {
    sequelize,
    modelName: "order_db",
    underscored: true,
    tableName: "orders_db",
    indexes: [
        { fields: ["invoice_id"] },
        { fields: ["id_contract"] },
        { fields: ["client_id"] },
        { fields: ["collection_date"] },
        { fields: ["payment_status"] }
    ]
});

ServiceDbModel.init({
    service_id: { type: DataTypes.STRING(64), primaryKey: true, unique: true },
    service_full_name: { type: DataTypes.STRING(512), allowNull: false, defaultValue: "" },
    service_channel: { type: DataTypes.STRING(64), allowNull: false, defaultValue: "" },
    service_product: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "" },
    service_format: { type: DataTypes.STRING(512), allowNull: false, defaultValue: "" },
    service_description: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    service_unit: { type: DataTypes.STRING(128), allowNull: false, defaultValue: "" },
    service_unit_price: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    service_unit_specifications: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" }
}, {
    sequelize,
    modelName: "service_db",
    underscored: true,
    tableName: "services_db",
    timestamps: false,
    indexes: [
        { fields: ["service_full_name"] },
        { fields: ["service_channel"] },
        { fields: ["service_product"] }
    ]
});

NotificationDbModel.init({
    panel_ticket_id: { type: DataTypes.STRING(255), primaryKey: true },
    panel_ticket_type: { type: DataTypes.STRING(255), allowNull: false },
    panel_ticket_category: { type: DataTypes.STRING(255), allowNull: true },
    panel_ticket_state: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "pending" },
    panel_ticket_date: { type: DataTypes.DATE, allowNull: true },
    panel_ticket_brief_description: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    panel_ticket_full_description: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    panel_ticket_related_to_user_id_array: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: false, defaultValue: [] },
    panel_ticket_updates_array: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] }
}, {
    sequelize,
    modelName: "notification",
    underscored: true,
    tableName: "panel_tickets",
    createdAt: "panel_ticket_created_at",
    updatedAt: false,
    indexes: [
        { fields: ["panel_ticket_type"] },
        { fields: ["panel_ticket_state"] },
        { fields: ["panel_ticket_date"] },
        { fields: ["panel_ticket_category"] }
    ]
});

NotificationCommentDbModel.init({
    panel_ticket_comment_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    panel_ticket_id: { type: DataTypes.STRING(255), allowNull: false, references: { model: "panel_tickets", key: "panel_ticket_id" } },
    agent_id: { type: DataTypes.STRING(255), allowNull: true, references: { model: "agents_db", key: "agent_id" } },
    panel_ticket_comment_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    panel_ticket_comment_content: { type: DataTypes.TEXT, allowNull: false }
}, {
    sequelize,
    modelName: "notification_comment",
    underscored: true,
    tableName: "panel_ticket_comments",
    timestamps: false,
    indexes: [
        { fields: ["panel_ticket_id"] },
        { fields: ["panel_ticket_comment_date"] },
        { fields: ["agent_id"] }
    ]
});

NotificationCompanyContentDbModel.init({
    ticket_company_data_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ticket_id: { type: DataTypes.STRING(255), allowNull: false, unique: true, references: { model: "panel_tickets", key: "panel_ticket_id" } },
    ticket_company_name: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "" },
    ticket_company_tax_name: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "" },
    ticket_company_tax_id: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "" },
    ticket_company_creator_role: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "" },
    ticket_company_website: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "" },
    ticket_company_country: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "" },
    ticket_company_description: { type: DataTypes.TEXT, allowNull: true, defaultValue: "" }
}, {
    sequelize,
    modelName: "notification_company_content",
    underscored: true,
    tableName: "panel_ticket_company_data",
    timestamps: false,
    indexes: []
});

PublicationSlotDbModel.init({
    publication_slot_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    publication_id: { type: DataTypes.STRING(255), allowNull: true },
    publication_format: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "flipbook" },
    slot_key: { type: DataTypes.STRING(32), allowNull: false },
    slot_content_type: { type: DataTypes.STRING(32), allowNull: false },
    slot_state: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "pending" },
    customer_id: { type: DataTypes.STRING(64), allowNull: true },
    project_id: { type: DataTypes.STRING(64), allowNull: true },
    slot_media_url: { type: DataTypes.STRING(512), allowNull: true },
    slot_article_id: { type: DataTypes.STRING(64), allowNull: true }
}, {
    sequelize,
    modelName: "publication_slot",
    underscored: true,
    tableName: "publication_slots_db",
    timestamps: true,
    createdAt: "slot_created_at",
    updatedAt: "slot_updated_at",
    indexes: [
        { fields: ["publication_id"] },
        { fields: ["customer_id"] }
    ]
});

PublicationSlotContentDbModel.init({
    publication_slot_content_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    publication_id: { type: DataTypes.STRING(255), allowNull: false },
    publication_slot_id: { type: DataTypes.INTEGER, allowNull: false },
    publication_slot_position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    slot_content_format: { type: DataTypes.STRING(64), allowNull: false, defaultValue: "" },
    slot_content_object_array: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] }
}, {
    sequelize,
    modelName: "publication_slot_content",
    underscored: true,
    tableName: "publication_slot_content",
    timestamps: false,
    indexes: [
        { fields: ["publication_id"] },
        { fields: ["publication_slot_id"] },
        { fields: ["publication_id", "publication_slot_id", "publication_slot_position"] }
    ]
});

OfferedPreferentialPageDbModel.init({
    offered_page_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    publication_id: { type: DataTypes.STRING(255), allowNull: true },
    publication_slot_id: { type: DataTypes.INTEGER, allowNull: true },
    offered_page_type: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "" },
    offered_slot_key: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "" },
    agent_id: { type: DataTypes.STRING(255), allowNull: true },
    customer_id: { type: DataTypes.STRING(255), allowNull: true },
    proposal_id: { type: DataTypes.STRING(255), allowNull: true },
    offered_page_proposal_date: { type: DataTypes.DATEONLY, allowNull: true }
}, {
    sequelize,
    modelName: "offered_preferential_page",
    underscored: true,
    tableName: "offered_preferential_pages",
    timestamps: false,
    indexes: [
        { fields: ["publication_id"] },
        { fields: ["publication_slot_id"] },
        { fields: ["proposal_id"] }
    ]
});

OfferedPreferentialPageDbModel.belongsTo(PublicationSlotDbModel, { foreignKey: "publication_slot_id", as: "slot" });

PublicationSlotDbModel.hasMany(PublicationSlotContentDbModel, { foreignKey: "publication_slot_id", as: "slot_contents", onDelete: "CASCADE" });
PublicationSlotContentDbModel.belongsTo(PublicationSlotDbModel, { foreignKey: "publication_slot_id", as: "slot" });
PublicationSlotContentDbModel.belongsTo(PublicationModel, { foreignKey: "publication_id", targetKey: "publication_id", as: "publication" });

defineAssociations();
}

export { ArticleModel, ContentModel, PublicationModel, EventModel, CompanyModel, ProductModel, BannerModel, FolderModel, MediaModel, CompanyCategoryModel, TopicDbModel, CustomerDbModel, ContactDbModel, ContactCommentDbModel, AgentDbModel, MagazineDbModel, ProviderDbModel, ProviderInvoiceDbModel, ProposalDbModel, ContractDbModel, ProjectDbModel, PmEventDbModel, IssuedInvoiceDbModel, OrderDbModel, ServiceDbModel, NotificationDbModel, NotificationCommentDbModel, NotificationCompanyContentDbModel, PublicationSlotDbModel, PublicationSlotContentDbModel, OfferedPreferentialPageDbModel };

