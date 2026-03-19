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
import CustomerDbModel from "../features/customer_db/CustomerDbModel.js";
import ContactDbModel from "../features/contact_db/ContactDbModel.js";
import AgentDbModel from "../features/agent_db/AgentDbModel.js";
import MagazineDbModel from "../features/magazine_db/MagazineDbModel.js";
import MagazineIssueDbModel from "../features/magazine_db/MagazineIssueDbModel.js";
import ProviderDbModel from "../features/provider_db/ProviderDbModel.js";
import ProviderInvoiceDbModel from "../features/provider_db/ProviderInvoiceDbModel.js";
import ProposalDbModel from "../features/proposal_db/ProposalDbModel.js";
import ContractDbModel from "../features/contract_db/ContractDbModel.js";
import ProjectDbModel from "../features/project_db/ProjectDbModel.js";
import PmEventDbModel from "../features/pm_event_db/PmEventDbModel.js";
import IssuedInvoiceDbModel from "../features/billing_db/IssuedInvoiceDbModel.js";
import OrderDbModel from "../features/billing_db/OrderDbModel.js";
import ServiceDbModel from "../features/service_db/ServiceDbModel.js";
import NotificationDbModel from "../features/notification_db/NotificationDbModel.js";
import NotificationCommentDbModel from "../features/notification_db/NotificationCommentDbModel.js";
import NotificationCompanyContentDbModel from "../features/notification_db/NotificationCompanyContentDbModel.js";
import PlannedPublicationDbModel from "../features/publication_workflow/PlannedPublicationDbModel.js";
import FlatplanDbModel from "../features/publication_workflow/FlatplanDbModel.js";
import PublicationSlotDbModel from "../features/publication_workflow/PublicationSlotDbModel.js";
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

CompanyCategoryModel.init({
    id_category: {
        type: DataTypes.STRING(32),
        primaryKey: true,
        unique: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ""
    },
    portals_array: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        defaultValue: []
    }
}, {
    sequelize,
    modelName: "company_category",
    underscored: true,
    tableName: "company_categories",
    indexes: [
        { fields: ["name"] }
    ]
});

CustomerDbModel.init({
    id_customer: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        unique: true
    },
    name: { type: DataTypes.STRING(512), allowNull: false },
    cif: { type: DataTypes.STRING(64), allowNull: true, defaultValue: "" },
    country: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "" },
    address: { type: DataTypes.TEXT, allowNull: true, defaultValue: "" },
    phone: { type: DataTypes.STRING(128), allowNull: true, defaultValue: "" },
    email: { type: DataTypes.STRING(512), allowNull: true, defaultValue: "" },
    website: { type: DataTypes.STRING(512), allowNull: true, defaultValue: "" },
    industry: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "" },
    segment: { type: DataTypes.STRING(128), allowNull: true, defaultValue: "" },
    owner: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "" },
    source: { type: DataTypes.STRING(128), allowNull: true, defaultValue: "" },
    status: { type: DataTypes.STRING(64), allowNull: true, defaultValue: "active" },
    revenue_eur: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0 },
    next_activity: { type: DataTypes.TEXT, allowNull: true, defaultValue: "" },
    tags: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true, defaultValue: [] },
    contact: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    contacts: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    comments: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    proposals: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true, defaultValue: [] },
    contracts: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true, defaultValue: [] },
    projects: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true, defaultValue: [] },
    related_accounts: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true, defaultValue: [] },
    portal_products: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    company_categories_array: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true, defaultValue: [] }
}, {
    sequelize,
    modelName: "customer_db",
    underscored: true,
    tableName: "customers_db",
    indexes: [
        { fields: ["name"] },
        { fields: ["country"] },
        { fields: ["status"] },
        { fields: ["owner"] }
    ]
});

ContactDbModel.init({
    id_contact: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        unique: true
    },
    name: { type: DataTypes.STRING(512), allowNull: false },
    role: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "" },
    email: { type: DataTypes.STRING(512), allowNull: true, defaultValue: "" },
    phone: { type: DataTypes.STRING(128), allowNull: true, defaultValue: "" },
    id_customer: { type: DataTypes.STRING(64), allowNull: true, defaultValue: "" },
    company_name: { type: DataTypes.STRING(512), allowNull: true, defaultValue: "" },
    id_user: { type: DataTypes.STRING(128), allowNull: true, defaultValue: "" },
    linkedin_profile: { type: DataTypes.STRING(512), allowNull: true, defaultValue: "" },
    based_in_country: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "" },
    comments: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    user_list_array: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true, defaultValue: [] }
}, {
    sequelize,
    modelName: "contact_db",
    underscored: true,
    tableName: "contacts_db",
    indexes: [
        { fields: ["name"] },
        { fields: ["id_customer"] },
        { fields: ["email"] },
        { fields: ["company_name"] }
    ]
});

AgentDbModel.init({
    id_agent: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        unique: true
    },
    name: { type: DataTypes.STRING(512), allowNull: false },
    email: { type: DataTypes.STRING(512), allowNull: true, defaultValue: "" }
}, {
    sequelize,
    modelName: "agent_db",
    underscored: true,
    tableName: "agents_db",
    indexes: [
        { fields: ["name"] }
    ]
});

MagazineDbModel.init({
    id_magazine: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        unique: true
    },
    name: { type: DataTypes.STRING(512), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true, defaultValue: "" },
    first_year: { type: DataTypes.INTEGER, allowNull: true },
    last_year: { type: DataTypes.INTEGER, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true, defaultValue: "" },
    portal_name: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "" }
}, {
    sequelize,
    modelName: "magazine",
    underscored: true,
    tableName: "magazines",
    timestamps: false,
    indexes: [
        { fields: ["name"] },
        { fields: ["first_year"] },
        { fields: ["last_year"] }
    ]
});

MagazineIssueDbModel.init({
    id_magazine: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        allowNull: false,
        references: { model: "magazine", key: "id_magazine" }
    },
    year: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    issue_number: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    is_special_edition: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    special_topic: { type: DataTypes.STRING(512), allowNull: true },
    forecasted_publication_month: { type: DataTypes.INTEGER, allowNull: true }
}, {
    sequelize,
    modelName: "magazine_issue",
    underscored: true,
    tableName: "magazine_issues",
    timestamps: false,
    indexes: [
        { fields: ["id_magazine", "year"] }
    ]
});

ProviderDbModel.init({
    id_provider: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        unique: true
    },
    name: {
        type: DataTypes.STRING(512),
        allowNull: false
    },
    contact_email: {
        type: DataTypes.STRING(512),
        allowNull: true,
        defaultValue: ""
    },
    contact_phone: {
        type: DataTypes.STRING(128),
        allowNull: true,
        defaultValue: ""
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ""
    },
    tax_id: {
        type: DataTypes.STRING(64),
        allowNull: true,
        defaultValue: ""
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ""
    }
}, {
    sequelize,
    modelName: "provider_db",
    underscored: true,
    tableName: "providers_db",
    indexes: [
        { fields: ["name"] }
    ]
});

ProviderInvoiceDbModel.init({
    id: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        unique: true
    },
    id_provider: {
        type: DataTypes.STRING(64),
        allowNull: false,
        references: { model: "providers_db", key: "id_provider" }
    },
    provider_name: {
        type: DataTypes.STRING(512),
        allowNull: false
    },
    label: {
        type: DataTypes.STRING(512),
        allowNull: false,
        defaultValue: ""
    },
    amount_eur: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0
    },
    payment_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    }
}, {
    sequelize,
    modelName: "provider_invoice_db",
    underscored: true,
    tableName: "provider_invoices_db",
    indexes: [
        { fields: ["id_provider"] },
        { fields: ["payment_date"] }
    ]
});

ProposalDbModel.init({
    id_proposal: { type: DataTypes.STRING(64), primaryKey: true, unique: true },
    id_customer: { type: DataTypes.STRING(64), allowNull: false },
    id_contact: { type: DataTypes.STRING(64), allowNull: true, defaultValue: "" },
    additional_contact_ids: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true, defaultValue: [] },
    agent: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "" },
    status: { type: DataTypes.STRING(64), allowNull: false },
    title: { type: DataTypes.STRING(512), allowNull: false },
    amount_eur: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0 },
    proposal_date: { type: DataTypes.DATEONLY, allowNull: true },
    date_created: { type: DataTypes.DATEONLY, allowNull: true },
    expiration_date: { type: DataTypes.DATEONLY, allowNull: true },
    general_discount_pct: { type: DataTypes.DECIMAL(6, 2), allowNull: true, defaultValue: 0 },
    service_lines: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    payments: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    is_exchange: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    exchange_has_final_price: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    exchange_final_price: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0 },
    exchange_has_bank_transfers: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    exchange_plynium_transfer_date: { type: DataTypes.DATEONLY, allowNull: true },
    exchange_counterpart_date: { type: DataTypes.DATEONLY, allowNull: true },
    exchange_transferred_amount: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0 },
    exchange_to_be_received_html: { type: DataTypes.TEXT, allowNull: true, defaultValue: "" }
}, {
    sequelize,
    modelName: "proposal_db",
    underscored: true,
    tableName: "proposals_db",
    indexes: [
        { fields: ["id_customer"] },
        { fields: ["status"] },
        { fields: ["agent"] },
        { fields: ["date_created"] }
    ]
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
    id_event: { type: DataTypes.STRING(64), primaryKey: true, unique: true },
    id_project: { type: DataTypes.STRING(64), allowNull: false },
    id_customer: { type: DataTypes.STRING(64), allowNull: false },
    event_type: { type: DataTypes.STRING(64), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    event_description: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    event_state: { type: DataTypes.STRING(64), allowNull: false, defaultValue: "pending" }
}, {
    sequelize,
    modelName: "pm_event_db",
    underscored: true,
    tableName: "pm_events_db",
    indexes: [
        { fields: ["id_project"] },
        { fields: ["id_customer"] },
        { fields: ["event_type"] },
        { fields: ["date"] },
        { fields: ["event_state"] }
    ]
});

IssuedInvoiceDbModel.init({
    invoice_id: { type: DataTypes.STRING(64), primaryKey: true, unique: true },
    id_contract: { type: DataTypes.STRING(64), allowNull: true },
    contract_code: { type: DataTypes.STRING(64), allowNull: false },
    client_id: { type: DataTypes.STRING(64), allowNull: false },
    client_name: { type: DataTypes.STRING(512), allowNull: false },
    agent: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "" },
    amount_eur: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    issue_date: { type: DataTypes.DATEONLY, allowNull: false },
    invoice_state: { type: DataTypes.STRING(64), allowNull: true, defaultValue: "" }
}, {
    sequelize,
    modelName: "issued_invoice_db",
    underscored: true,
    tableName: "issued_invoices_db",
    indexes: [
        { fields: ["id_contract"] },
        { fields: ["client_id"] },
        { fields: ["issue_date"] },
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
    id_service: { type: DataTypes.STRING(64), primaryKey: true, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    service_type: { type: DataTypes.STRING(64), allowNull: false, defaultValue: "" },
    display_name: { type: DataTypes.STRING(512), allowNull: false, defaultValue: "" },
    description: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    service_description: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    tariff_price_eur: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    unit: { type: DataTypes.STRING(128), allowNull: false, defaultValue: "" },
    delivery_days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    publication_date: { type: DataTypes.DATEONLY, allowNull: true }
}, {
    sequelize,
    modelName: "service_db",
    underscored: true,
    tableName: "services_db",
    timestamps: false,
    indexes: [
        { fields: ["name"] },
        { fields: ["service_type"] }
    ]
});

NotificationDbModel.init({
    id: { type: DataTypes.STRING(64), primaryKey: true, unique: true },
    notification_type: { type: DataTypes.STRING(32), allowNull: false },
    notification_category: { type: DataTypes.STRING(32), allowNull: true },
    state: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "pending" },
    date: { type: DataTypes.DATE, allowNull: true },
    brief_description: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    description: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    sender_email: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "" },
    sender_company: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "" },
    sender_contact_phone: { type: DataTypes.STRING(64), allowNull: true, defaultValue: "" },
    country: { type: DataTypes.STRING(128), allowNull: true, defaultValue: "" },
    user_id: { type: DataTypes.STRING(64), allowNull: true, defaultValue: "" }
}, {
    sequelize,
    modelName: "notification",
    underscored: true,
    tableName: "notifications",
    indexes: [
        { fields: ["notification_type"] },
        { fields: ["state"] },
        { fields: ["date"] },
        { fields: ["notification_category"] }
    ]
});

NotificationCommentDbModel.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    notification_id: { type: DataTypes.STRING(64), allowNull: false, references: { model: "notifications", key: "id" } },
    date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    content: { type: DataTypes.TEXT, allowNull: false }
}, {
    sequelize,
    modelName: "notification_comment",
    underscored: true,
    tableName: "notification_comments",
    timestamps: false,
    indexes: [
        { fields: ["notification_id"] },
        { fields: ["date"] }
    ]
});

NotificationCompanyContentDbModel.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    notification_id: { type: DataTypes.STRING(64), allowNull: false, unique: true, references: { model: "notifications", key: "id" } },
    nombre_comercial: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "" },
    nombre_fiscal: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "" },
    tax_id: { type: DataTypes.STRING(64), allowNull: false, defaultValue: "" },
    cargo_creador: { type: DataTypes.STRING(128), allowNull: false, defaultValue: "" },
    web_empresa: { type: DataTypes.STRING(512), allowNull: true, defaultValue: "" },
    pais_empresa: { type: DataTypes.STRING(128), allowNull: true, defaultValue: "" },
    descripcion_empresa: { type: DataTypes.TEXT, allowNull: true, defaultValue: "" }
}, {
    sequelize,
    modelName: "notification_company_content",
    underscored: true,
    tableName: "notification_company_content",
    indexes: []
});

PlannedPublicationDbModel.init({
    id_planned_publication: { type: DataTypes.STRING(64), primaryKey: true, unique: true },
    id_magazine: { type: DataTypes.STRING(64), allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    issue_number: { type: DataTypes.INTEGER, allowNull: false },
    edition_name: { type: DataTypes.STRING(512), allowNull: false, defaultValue: '' },
    theme: { type: DataTypes.STRING(512), allowNull: true, defaultValue: '' },
    publication_date: { type: DataTypes.DATEONLY, allowNull: true }
}, {
    sequelize,
    modelName: "planned_publication",
    underscored: true,
    tableName: "planned_publications",
    indexes: [
        { fields: ["id_magazine"] },
        { fields: ["year"] },
        { fields: ["publication_date"] }
    ]
});

FlatplanDbModel.init({
    id_flatplan: { type: DataTypes.STRING(64), primaryKey: true, unique: true },
    id_magazine: { type: DataTypes.STRING(64), allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    issue_number: { type: DataTypes.INTEGER, allowNull: false },
    edition_name: { type: DataTypes.STRING(512), allowNull: false, defaultValue: '' },
    theme: { type: DataTypes.STRING(512), allowNull: true, defaultValue: '' },
    publication_date: { type: DataTypes.DATEONLY, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true, defaultValue: '' }
}, {
    sequelize,
    modelName: "flatplan",
    underscored: true,
    tableName: "flatplans",
    indexes: [
        { fields: ["id_magazine"] },
        { fields: ["year"] },
        { fields: ["publication_date"] }
    ]
});

PublicationSlotDbModel.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    planned_publication_id: { type: DataTypes.STRING(64), allowNull: true, references: { model: "planned_publications", key: "id_planned_publication" } },
    flatplan_id: { type: DataTypes.STRING(64), allowNull: true, references: { model: "flatplans", key: "id_flatplan" } },
    slot_key: { type: DataTypes.STRING(32), allowNull: false },
    content_type: { type: DataTypes.STRING(32), allowNull: false },
    state: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending' },
    id_advertiser: { type: DataTypes.STRING(64), allowNull: true },
    id_project: { type: DataTypes.STRING(64), allowNull: true },
    image_src: { type: DataTypes.STRING(512), allowNull: true },
    article_id: { type: DataTypes.STRING(64), allowNull: true }
}, {
    sequelize,
    modelName: "publication_slot",
    underscored: true,
    tableName: "publication_slots",
    indexes: [
        { fields: ["planned_publication_id"] },
        { fields: ["flatplan_id"] },
        { fields: ["id_advertiser"] }
    ]
});

PlannedPublicationDbModel.hasMany(PublicationSlotDbModel, { foreignKey: "planned_publication_id", as: "slots", onDelete: "CASCADE" });
PublicationSlotDbModel.belongsTo(PlannedPublicationDbModel, { foreignKey: "planned_publication_id" });

FlatplanDbModel.hasMany(PublicationSlotDbModel, { foreignKey: "flatplan_id", as: "slots", onDelete: "CASCADE" });
PublicationSlotDbModel.belongsTo(FlatplanDbModel, { foreignKey: "flatplan_id" });

defineAssociations();
}

export { ArticleModel, ContentModel, PublicationModel, EventModel, CompanyModel, ProductModel, BannerModel, FolderModel, MediaModel, CompanyCategoryModel, CustomerDbModel, ContactDbModel, AgentDbModel, MagazineDbModel, MagazineIssueDbModel, ProviderDbModel, ProviderInvoiceDbModel, ProposalDbModel, ContractDbModel, ProjectDbModel, PmEventDbModel, IssuedInvoiceDbModel, OrderDbModel, ServiceDbModel, NotificationDbModel, NotificationCommentDbModel, NotificationCompanyContentDbModel, PlannedPublicationDbModel, FlatplanDbModel, PublicationSlotDbModel };

