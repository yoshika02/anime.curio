-- Cloudflare D1 Database Schema for AnimeCurio
-- Copy and run these SQL queries directly inside Cloudflare D1 Studio!

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    country TEXT DEFAULT 'India',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    total_amount REAL NOT NULL,
    payment_status TEXT DEFAULT 'Payment Pending (QR Sent)',
    items_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Wishlist Table
CREATE TABLE IF NOT EXISTS wishlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    product_id TEXT NOT NULL,
    product_title TEXT NOT NULL,
    product_price REAL NOT NULL,
    product_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
