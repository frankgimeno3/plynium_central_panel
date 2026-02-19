-- Create products table (run once if the table does not exist)
-- Compatible with Sequelize ProductModel (modelName: 'product', tableName: 'products')

CREATE TABLE IF NOT EXISTS products (
    product_id VARCHAR(255) PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    company VARCHAR(255) DEFAULT '',
    product_description TEXT DEFAULT '',
    main_image_src VARCHAR(512) DEFAULT '',
    product_categories_array TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS products_product_name ON products (product_name);
CREATE INDEX IF NOT EXISTS products_company ON products (company);
