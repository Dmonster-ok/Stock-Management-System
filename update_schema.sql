USE stock_management;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS stock_transactions;
DROP TABLE IF EXISTS product_batches;
DROP TABLE IF EXISTS product_attributes;
DROP TABLE IF EXISTS product_suppliers;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS unit_types;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Owner', 'Manager', 'Staff') NOT NULL DEFAULT 'Staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Unit Types table
CREATE TABLE unit_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    abbreviation VARCHAR(10) NOT NULL UNIQUE,
    type ENUM('Weight', 'Volume', 'Count', 'Length') NOT NULL,
    base_unit BOOLEAN DEFAULT FALSE,
    conversion_factor DECIMAL(10,4) DEFAULT 1.0000
);

-- Products table (Enhanced)
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    barcode VARCHAR(100),
    description TEXT,
    category_id INT,
    unit_type_id INT,
    cost_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    current_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    minimum_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    maximum_stock DECIMAL(10,3),
    reorder_point DECIMAL(10,3),
    has_batches BOOLEAN DEFAULT FALSE,
    has_expiry BOOLEAN DEFAULT FALSE,
    shelf_life_days INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (unit_type_id) REFERENCES unit_types(id) ON DELETE RESTRICT
);

-- Suppliers table
CREATE TABLE suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20)
);

-- Product Suppliers (Enhanced with supplier-specific pricing)
CREATE TABLE product_suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    supplier_id INT NOT NULL,
    supplier_sku VARCHAR(50),
    supplier_price DECIMAL(10,2),
    minimum_order_qty DECIMAL(10,3) DEFAULT 1,
    lead_time_days INT DEFAULT 7,
    is_preferred BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_product_supplier (product_id, supplier_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

-- Product Batches/Lots table
CREATE TABLE product_batches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    available_quantity DECIMAL(10,3) NOT NULL,
    cost_price DECIMAL(10,2),
    manufacture_date DATE,
    expiry_date DATE,
    supplier_id INT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_product_batch (product_id, batch_number),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Product Attributes table (for custom attributes)
CREATE TABLE product_attributes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    attribute_name VARCHAR(50) NOT NULL,
    attribute_value TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Stock Transactions table (Enhanced)
CREATE TABLE stock_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    batch_id INT,
    transaction_type ENUM('In', 'Out', 'Adjustment', 'Transfer') NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,2),
    reference_id VARCHAR(50),
    reference_type ENUM('Purchase', 'Sale', 'Adjustment', 'Transfer', 'Production', 'Damage') DEFAULT 'Adjustment',
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (batch_id) REFERENCES product_batches(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Invoices table
CREATE TABLE invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('Paid', 'Unpaid') NOT NULL DEFAULT 'Unpaid',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Invoice Items table
CREATE TABLE invoice_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Indexes for better performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_unit_type ON products(unit_type_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_product_suppliers_product ON product_suppliers(product_id);
CREATE INDEX idx_product_suppliers_supplier ON product_suppliers(supplier_id);
CREATE INDEX idx_product_batches_product ON product_batches(product_id);
CREATE INDEX idx_product_batches_expiry ON product_batches(expiry_date);
CREATE INDEX idx_stock_transactions_product ON stock_transactions(product_id);
CREATE INDEX idx_stock_transactions_batch ON stock_transactions(batch_id);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);

-- Create demo users
-- Owner (password: owner123)
INSERT INTO users (username, password, role) VALUES ('owner', '$2b$10$tz11sBu8hKnD2YgEhGGrGerZ7bi4ve4uKlt9NQbuUH7LHL6RDrPom', 'Owner');

-- Manager (password: manager123)
INSERT INTO users (username, password, role) VALUES ('manager', '$2b$10$oGCLvE0Y49K7Y3WkAzWIZeK/f0jw4a1QLdID2oyJDmeiKDvI3FMJO', 'Manager');

-- Staff (password: staff123)
INSERT INTO users (username, password, role) VALUES ('staff', '$2b$10$hkzTbdjrbsa6.1HHFUNCZuZenf8pM.fEim1F9hO/nQBqi9TEGfvcq', 'Staff');

-- Insert default unit types
INSERT INTO unit_types (name, abbreviation, type, base_unit) VALUES 
('Pieces', 'pcs', 'Count', true),
('Kilograms', 'kg', 'Weight', true),
('Grams', 'g', 'Weight', false),
('Liters', 'L', 'Volume', true),
('Milliliters', 'ml', 'Volume', false),
('Meters', 'm', 'Length', true),
('Centimeters', 'cm', 'Length', false),
('Boxes', 'box', 'Count', false),
('Dozens', 'doz', 'Count', false),
('Pairs', 'pair', 'Count', false);

-- Update conversion factors for non-base units
UPDATE unit_types SET conversion_factor = 0.001 WHERE abbreviation = 'g';
UPDATE unit_types SET conversion_factor = 0.001 WHERE abbreviation = 'ml';
UPDATE unit_types SET conversion_factor = 0.01 WHERE abbreviation = 'cm';
UPDATE unit_types SET conversion_factor = 12 WHERE abbreviation = 'doz';
UPDATE unit_types SET conversion_factor = 2 WHERE abbreviation = 'pair';

-- Insert sample categories
INSERT INTO categories (name, description) VALUES 
('Electronics', 'Electronic devices and accessories'),
('Clothing', 'Apparel and fashion items'),
('Food & Beverage', 'Consumable products'),
('Health & Beauty', 'Personal care products'),
('Home & Garden', 'Household and garden items');

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, email, phone) VALUES 
('TechCorp Ltd', 'John Smith', 'john@techcorp.com', '+1-555-0101'),
('Fashion House', 'Jane Doe', 'jane@fashionhouse.com', '+1-555-0102'),
('Global Foods', 'Mike Johnson', 'mike@globalfoods.com', '+1-555-0103'),
('Beauty Supplies Co', 'Sarah Wilson', 'sarah@beautysupplies.com', '+1-555-0104');

-- Insert sample products
INSERT INTO products (name, sku, description, category_id, unit_type_id, cost_price, selling_price, current_stock, minimum_stock, has_batches, has_expiry) VALUES 
('Smartphone Pro X1', 'SPX1-001', 'Latest smartphone with advanced features', 1, 1, 450.00, 699.99, 25, 5, false, false),
('Cotton T-Shirt', 'CTS-M-BLU', 'Premium cotton t-shirt in blue', 2, 1, 12.50, 29.99, 150, 20, false, false),
('Organic Apple Juice', 'OAJ-1L', 'Fresh organic apple juice 1L', 3, 4, 2.50, 4.99, 48, 12, true, true),
('Anti-Aging Cream', 'AAC-50ML', 'Premium anti-aging face cream', 4, 5, 25.00, 49.99, 30, 8, true, true);