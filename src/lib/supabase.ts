import { createClient } from '@supabase/supabase-js';

// Hardcoded fallbacks ensure the client always connects even when env vars
// are not yet injected (e.g. first load in preview, Vite define race, etc.)
const FALLBACK_URL = 'https://fmjxxldlqirmnzkekjkf.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtanh4bGRscWlybW56a2VramtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzA0NzIsImV4cCI6MjA4OTQ0NjQ3Mn0.PX18WAPpzzg-emMbxV2bz-yR5fo-MjvVMvDQAYZeTrc';

const supabaseUrl: string =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  (process.env.SUPABASE_URL as string) ||
  (process.env.NEXT_PUBLIC_SUPABASE_URL as string) ||
  FALLBACK_URL;

const supabaseAnonKey: string =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (process.env.SUPABASE_ANON_KEY as string) ||
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) ||
  FALLBACK_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Community = {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  message: string;
  topic: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  reply_count: number;
  is_pinned: boolean;
  is_edited: boolean;
  is_deleted: boolean;
};

export type CommunityReply = {
  id: string;
  message_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  reply: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  is_deleted: boolean;
};

export type CommunityLike = {
  id: string;
  message_id: string;
  user_id: string;
  created_at: string;
};

export type CommunityReport = {
  id: string;
  message_id: string;
  reported_by: string;
  reason?: string;
  created_at: string;
  status: string;
};

export type CommunityReaction = {
  id: string;
  message_id: string;
  user_id: string;
  reaction_emoji: string;
  created_at: string;
};

export type CommunityGuideline = {
  id: string;
  content: string;
  created_at: string;
};

// Marketplace Types
export type MarketplaceProduct = {
  id: string;
  seller_id: string;
  seller?: { user_name: string; user_avatar?: string };
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  discount_percentage?: number;
  images: string[];
  stock_quantity: number;
  rating: number;
  review_count: number;
  views_count: number;
  status: 'active' | 'inactive' | 'removed';
  created_at: string;
  updated_at: string;
};

export type ShoppingCart = {
  id: string;
  user_id: string;
  items?: CartItem[];
  created_at: string;
  updated_at: string;
};

export type CartItem = {
  id: string;
  cart_id: string;
  product_id: string;
  product?: MarketplaceProduct;
  quantity: number;
  added_at: string;
};

export type MarketplaceOrder = {
  id: string;
  buyer_id: string;
  order_number: string;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total_amount: number;
  order_status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'unpaid' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  delivery_address: string;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  seller_id: string;
  product_title: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export type MarketplaceReview = {
  id: string;
  product_id: string;
  reviewer_id: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  helpful_count: number;
  verified_purchase: boolean;
  seller_response?: string;
  created_at: string;
  updated_at: string;
};

export type SellerAccount = {
  id: string;
  user_id: string;
  bank_account_number?: string;
  bank_name?: string;
  account_holder_name?: string;
  shop_name: string;
  shop_description?: string;
  shop_avatar?: string;
  total_sales: number;
  rating: number;
  created_at: string;
};

export type Opportunity = {
  id: string;
  title: string;
  description: string;
  type: 'scholarship' | 'internship';
  organization: string;
  eligibility?: string;
  requirements?: string;
  deadline: string;
  application_url?: string;
  featured: boolean;
  views_count: number;
  applications_count: number;
  status: 'active' | 'closed' | 'archived';
  created_at: string;
  updated_at: string;
};

export type UserApplication = {
  id: string;
  user_id: string;
  opportunity_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  applied_at: string;
  updated_at: string;
};
