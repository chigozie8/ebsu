-- Marketplace and Opportunities Database Schema

-- ==================== MARKETPLACE TABLES ====================

-- Seller Accounts Table
CREATE TABLE IF NOT EXISTS seller_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name VARCHAR(255),
  store_description TEXT,
  store_logo_url TEXT,
  verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
  response_time_hours INT,
  return_period_days INT DEFAULT 30,
  bank_account_name VARCHAR(255),
  bank_account_number VARCHAR(50),
  bank_code VARCHAR(10),
  account_number_verified BOOLEAN DEFAULT FALSE,
  total_sales_count INT DEFAULT 0,
  total_revenue DECIMAL(15, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Products/Listings Table
CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  price DECIMAL(10, 2) NOT NULL,
  discount_percentage INT DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  images TEXT[] DEFAULT '{}',
  stock_quantity INT NOT NULL DEFAULT 0,
  weight DECIMAL(8, 3),
  dimensions_length DECIMAL(8, 2),
  dimensions_width DECIMAL(8, 2),
  dimensions_height DECIMAL(8, 2),
  tags TEXT[] DEFAULT '{}',
  rating DECIMAL(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  is_featured BOOLEAN DEFAULT FALSE,
  INDEX seller_idx (seller_id),
  INDEX status_idx (status),
  INDEX category_idx (category)
);

-- Product Images Table
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  INDEX product_idx (product_id)
);

-- Shopping Cart Table
CREATE TABLE IF NOT EXISTS shopping_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Cart Items Table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at TIMESTAMP DEFAULT now(),
  UNIQUE(cart_id, product_id),
  INDEX cart_idx (cart_id),
  INDEX product_idx (product_id)
);

-- Orders Table
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  discount_code VARCHAR(50),
  delivery_address TEXT NOT NULL,
  shipping_method VARCHAR(50),
  order_status VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  delivered_at TIMESTAMP,
  INDEX buyer_idx (buyer_id),
  INDEX status_idx (order_status)
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  product_title VARCHAR(255) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  seller_payout_status VARCHAR(20) DEFAULT 'pending' CHECK (seller_payout_status IN ('pending', 'processed', 'cancelled')),
  INDEX order_idx (order_id),
  INDEX seller_idx (seller_id)
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES marketplace_orders(id),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  images TEXT[] DEFAULT '{}',
  helpful_count INT DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT TRUE,
  seller_response TEXT,
  seller_response_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  INDEX product_idx (product_id),
  INDEX reviewer_idx (reviewer_id)
);

-- Review Helpfulness Table
CREATE TABLE IF NOT EXISTS review_helpfulness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES marketplace_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  is_helpful BOOLEAN,
  UNIQUE(review_id, user_id),
  INDEX review_idx (review_id)
);

-- Discount Codes Table
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(10) CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  max_uses INT,
  uses_count INT DEFAULT 0,
  expiry_date TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT now(),
  INDEX code_idx (code)
);

-- Seller Messages Table
CREATE TABLE IF NOT EXISTS seller_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES marketplace_orders(id),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  receiver_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  INDEX sender_idx (sender_id),
  INDEX receiver_idx (receiver_id)
);

-- Seller Transaction History
CREATE TABLE IF NOT EXISTS seller_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  order_item_id UUID REFERENCES order_items(id),
  transaction_type VARCHAR(50) CHECK (transaction_type IN ('sale', 'refund', 'payout')),
  amount DECIMAL(10, 2) NOT NULL,
  commission_amount DECIMAL(10, 2) DEFAULT 0,
  net_amount DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT now(),
  INDEX seller_idx (seller_id)
);

-- ==================== OPPORTUNITIES TABLES ====================

-- Opportunities Table
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('scholarship', 'internship')),
  organization VARCHAR(255) NOT NULL,
  eligibility TEXT,
  requirements TEXT,
  deadline TIMESTAMP NOT NULL,
  application_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  views_count INT DEFAULT 0,
  applications_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  INDEX type_idx (type),
  INDEX deadline_idx (deadline)
);

-- User Applications Table
CREATE TABLE IF NOT EXISTS user_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  applied_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, opportunity_id),
  INDEX user_idx (user_id),
  INDEX opportunity_idx (opportunity_id)
);

-- ==================== INDEXES FOR PERFORMANCE ====================

CREATE INDEX IF NOT EXISTS idx_marketplace_products_seller_status ON marketplace_products(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer_status ON marketplace_orders(buyer_id, order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON order_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_product_rating ON marketplace_reviews(product_id, rating);
CREATE INDEX IF NOT EXISTS idx_seller_transactions_seller_date ON seller_transactions(seller_id, created_at);

-- Enable Row Level Security
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Products (anyone can read active products)
CREATE POLICY "Anyone can view active products" ON marketplace_products
  FOR SELECT USING (status = 'active');

-- RLS Policies for Orders (users can only see their own orders)
CREATE POLICY "Users can view their own orders" ON marketplace_orders
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can insert their own orders" ON marketplace_orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- RLS Policies for Shopping Cart (users can only manage their own cart)
CREATE POLICY "Users can view their own cart" ON shopping_carts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart" ON shopping_carts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Reviews (users can see all reviews for active products)
CREATE POLICY "Anyone can view reviews for active products" ON marketplace_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM marketplace_products
      WHERE marketplace_products.id = marketplace_reviews.product_id
      AND marketplace_products.status = 'active'
    )
  );

-- RLS Policies for Seller Accounts
CREATE POLICY "Users can view any seller account" ON seller_accounts
  FOR SELECT USING (TRUE);

-- RLS Policies for Opportunities
CREATE POLICY "Anyone can view active opportunities" ON opportunities
  FOR SELECT USING (status = 'active');

-- RLS Policies for User Applications
CREATE POLICY "Users can view their own applications" ON user_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" ON user_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
