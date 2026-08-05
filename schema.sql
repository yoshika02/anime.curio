-- Cloudflare D1 Database Schema for AnimeCurio
-- ===============================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    pincode TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    total_amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'WhatsApp / COD',
    order_status TEXT DEFAULT 'Processing',
    items_json TEXT NOT NULL, -- JSON array of cart items
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Wishlist Table
CREATE TABLE IF NOT EXISTS wishlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT REFERENCES users(id),
    product_id TEXT NOT NULL,
    product_title TEXT NOT NULL,
    product_price REAL NOT NULL,
    product_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
