/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface CartItem {
  id: string;
  product_id: string;
  title: string;
  price: number;
  discount_percentage: number;
  quantity: number;
  seller_name: string;
  image: string;
}

const MOCK_CART: CartItem[] = [
  {
    id: "1",
    product_id: "1",
    title: "Anatomy Textbook 2024",
    price: 15000,
    discount_percentage: 10,
    quantity: 1,
    seller_name: "John Store",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: "2",
    product_id: "2",
    title: "Pharmacology Notes - Complete Guide",
    price: 5000,
    discount_percentage: 0,
    quantity: 2,
    seller_name: "Study Hub",
    image: "/placeholder.svg?height=100&width=100",
  },
];

export const ShoppingCartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>(MOCK_CART);

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const discountedPrice = item.price * (1 - item.discount_percentage / 100);
      return total + discountedPrice * item.quantity;
    }, 0);
  };

  const calculateTax = (subtotal: number) => subtotal * 0.075; // 7.5% tax
  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const shipping = subtotal > 50000 ? 0 : 2000;
  const total = subtotal + tax + shipping;

  const handleRemoveItem = (itemId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setCartItems(
      cartItems.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleCheckout = () => {
    navigate("/u/marketplace/checkout", { state: { cartItems } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green1 via-green2 to-green3 text-white py-12 px-4"
      >
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate("/u/marketplace")}
            className="flex items-center gap-2 text-green100 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-4xl font-bold font-poppins mb-2">Shopping Cart</h1>
          <p className="text-green100">
            {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in cart
          </p>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <p className="text-xl text-gray-500 mb-6 font-poppins">Your cart is empty</p>
            <button
              onClick={() => navigate("/u/marketplace")}
              className="bg-green1 text-white px-8 py-3 rounded-lg font-bold hover:bg-green2 transition-colors font-poppins"
            >
              Continue Shopping
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                      />

                      {/* Product Info */}
                      <div className="flex-grow">
                        <h3 className="font-bold text-gray-900 line-clamp-2 font-poppins mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 font-poppins mb-3">
                          Seller: {item.seller_name}
                        </p>

                        {/* Price */}
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-lg text-green1">
                            ₦{(item.price * (1 - item.discount_percentage / 100)).toLocaleString()}
                          </span>
                          {item.discount_percentage > 0 && (
                            <span className="text-sm text-gray-400 line-through font-poppins">
                              ₦{item.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity & Remove */}
                      <div className="flex flex-col justify-between items-end">
                        {/* Quantity Selector */}
                        <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity - 1)
                            }
                            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity + 1)
                            }
                            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-semibold mt-2 font-poppins"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Subtotal for this item */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                      <p className="text-sm text-gray-600 font-poppins">Subtotal:</p>
                      <p className="font-bold text-green1">
                        ₦
                        {(
                          item.price *
                          (1 - item.discount_percentage / 100) *
                          item.quantity
                        ).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg border border-gray-200 p-6 h-fit sticky top-4"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 font-poppins">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-poppins">Subtotal</span>
                  <span className="font-semibold">₦{subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-poppins">Tax (7.5%)</span>
                  <span className="font-semibold">₦{tax.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-poppins">Shipping</span>
                  <span className="font-semibold">
                    {shipping === 0 ? (
                      <span className="text-green-500">FREE</span>
                    ) : (
                      `₦${shipping.toLocaleString()}`
                    )}
                  </span>
                </div>

                {shipping === 0 && (
                  <p className="text-xs text-green-600 bg-green-50 p-2 rounded font-poppins">
                    ✓ Free shipping on orders over ₦50,000
                  </p>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg text-gray-900 font-poppins">Total</span>
                  <span className="font-bold text-2xl text-green1">
                    ₦{total.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-green1 to-green2 text-white py-3 rounded-lg font-bold hover:shadow-lg hover:shadow-green1/30 transition-all transform hover:-translate-y-0.5 mb-3 font-poppins"
              >
                Proceed to Checkout
              </button>

              <button
                onClick={() => navigate("/u/marketplace")}
                className="w-full border-2 border-green1 text-green1 py-3 rounded-lg font-bold hover:bg-green1/5 transition-colors font-poppins"
              >
                Continue Shopping
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};
