-- Create companies table (run once if the table does not exist)
-- Compatible with Sequelize CompanyModel (modelName: 'company', tableName: 'companies')

CREATE TABLE IF NOT EXISTS companies (
    company_id VARCHAR(255) PRIMARY KEY,
    commercial_name VARCHAR(255) NOT NULL,
    country VARCHAR(255) DEFAULT '',
    category VARCHAR(255) DEFAULT '',
    main_description TEXT DEFAULT '',
    main_image VARCHAR(512) DEFAULT '',
    products_array TEXT[] DEFAULT '{}',
    categories_array TEXT[] DEFAULT '{}',
    main_email VARCHAR(255) DEFAULT '',
    mail_telephone VARCHAR(100) DEFAULT '',
    full_address VARCHAR(512) DEFAULT '',
    web_link VARCHAR(512) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS companies_commercial_name ON companies (commercial_name);
CREATE INDEX IF NOT EXISTS companies_country ON companies (country);
CREATE INDEX IF NOT EXISTS companies_category ON companies (category);
