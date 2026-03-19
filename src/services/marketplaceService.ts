import { supabase, MarketplaceProduct, CartItem, MarketplaceOrder, MarketplaceReview } from '../lib/supabase';

// Product operations
export const marketplaceService = {
  // Get all products with optional filters
  async getProducts(filters?: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'newest' | 'price-low' | 'price-high' | 'popular';
  }) {
    let query = supabase
      .from('marketplace_products')
      .select('*, seller_accounts(shop_name, shop_avatar)')
      .eq('status', 'active');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    if (filters?.minPrice) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters?.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }

    // Apply sorting
    switch (filters?.sortBy) {
      case 'price-low':
        query = query.order('price', { ascending: true });
        break;
      case 'price-high':
        query = query.order('price', { ascending: false });
        break;
      case 'popular':
        query = query.order('views_count', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;
    return data || [];
  },

  // Get single product details
  async getProductById(productId: string) {
    const { data, error } = await supabase
      .from('marketplace_products')
      .select('*, seller_accounts(shop_name, shop_avatar, rating), marketplace_reviews(count)')
      .eq('id', productId)
      .single();

    if (error) throw error;

    // Update view count
    await supabase
      .from('marketplace_products')
      .update({ views_count: (data?.views_count || 0) + 1 })
      .eq('id', productId);

    return data;
  },

  // Get product reviews
  async getProductReviews(productId: string) {
    const { data, error } = await supabase
      .from('marketplace_reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Add review
  async addReview(review: {
    productId: string;
    orderId: string;
    rating: number;
    title?: string;
    comment?: string;
  }, userId: string) {
    const { data, error } = await supabase
      .from('marketplace_reviews')
      .insert({
        product_id: review.productId,
        order_id: review.orderId,
        reviewer_id: userId,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        verified_purchase: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Cart operations
  async getOrCreateCart(userId: string) {
    // Try to get existing cart
    let { data: cart, error } = await supabase
      .from('shopping_carts')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If no cart exists, create one
    if (error && error.code === 'PGRST116') {
      const { data: newCart, error: createError } = await supabase
        .from('shopping_carts')
        .insert({ user_id: userId })
        .select()
        .single();

      if (createError) throw createError;
      cart = newCart;
    } else if (error) {
      throw error;
    }

    return cart;
  },

  async getCartItems(cartId: string) {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, marketplace_products(*)')
      .eq('cart_id', cartId);

    if (error) throw error;
    return data || [];
  },

  async addToCart(cartId: string, productId: string, quantity: number) {
    const { data, error } = await supabase
      .from('cart_items')
      .upsert(
        {
          cart_id: cartId,
          product_id: productId,
          quantity,
        },
        { onConflict: 'cart_id,product_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeFromCart(cartItemId: string) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (error) throw error;
  },

  async updateCartItem(cartItemId: string, quantity: number) {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Order operations
  async createOrder(order: {
    buyerId: string;
    subtotal: number;
    shippingCost: number;
    tax: number;
    totalAmount: number;
    deliveryAddress: string;
    paymentMethod: string;
    cartItems: CartItem[];
  }) {
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data: orderData, error: orderError } = await supabase
      .from('marketplace_orders')
      .insert({
        buyer_id: order.buyerId,
        order_number: orderNumber,
        subtotal: order.subtotal,
        shipping_cost: order.shippingCost,
        tax: order.tax,
        total_amount: order.totalAmount,
        delivery_address: order.deliveryAddress,
        payment_method: order.paymentMethod,
        order_status: 'pending',
        payment_status: 'unpaid',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Add order items
    const orderItems = order.cartItems.map((item) => ({
      order_id: orderData.id,
      product_id: item.product_id,
      seller_id: item.product?.seller_id,
      product_title: item.product?.title,
      quantity: item.quantity,
      unit_price: item.product?.price || 0,
      subtotal: (item.product?.price || 0) * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return orderData;
  },

  async getOrdersByUser(userId: string) {
    const { data, error } = await supabase
      .from('marketplace_orders')
      .select('*')
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getOrderDetails(orderId: string) {
    const { data, error } = await supabase
      .from('marketplace_orders')
      .select('*, order_items(*, marketplace_products(*))')
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  },

  // Seller operations
  async getSellerProducts(sellerId: string) {
    const { data, error } = await supabase
      .from('marketplace_products')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createProduct(product: {
    sellerId: string;
    title: string;
    description: string;
    category: string;
    subcategory?: string;
    price: number;
    stockQuantity: number;
    images: string[];
  }) {
    const { data, error } = await supabase
      .from('marketplace_products')
      .insert({
        seller_id: product.sellerId,
        title: product.title,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        price: product.price,
        stock_quantity: product.stockQuantity,
        images: product.images,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProduct(productId: string, updates: Partial<MarketplaceProduct>) {
    const { data, error } = await supabase
      .from('marketplace_products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSellerStats(sellerId: string) {
    const { data: orders, error: ordersError } = await supabase
      .from('order_items')
      .select('subtotal')
      .eq('seller_id', sellerId);

    if (ordersError) throw ordersError;

    const { data: products, error: productsError } = await supabase
      .from('marketplace_products')
      .select('id')
      .eq('seller_id', sellerId);

    if (productsError) throw productsError;

    const totalRevenue = (orders || []).reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const totalProducts = (products || []).length;
    const totalOrders = (orders || []).length;

    return {
      totalRevenue,
      totalProducts,
      totalOrders,
    };
  },
};

export default marketplaceService;
