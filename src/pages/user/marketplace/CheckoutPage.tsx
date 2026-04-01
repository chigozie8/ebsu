/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { notifyUser } from "../../../helpers/notifyUser";

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentMethod, setPaymentMethod] = useState<"card" | "transfer" | "paystack">(
    "paystack"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const cartItems = location.state?.cartItems || [];
  const cartTotal =
    cartItems.reduce(
      (total: number, item: any) =>
        total +
        item.price * (1 - item.discount_percentage / 100) * item.quantity,
      0
    ) || 0;
  const tax = cartTotal * 0.075;
  const shipping = cartTotal > 50000 ? 0 : 2000;
  const total = cartTotal + tax + shipping;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.address
    ) {
      notifyUser("Please fill in all required fields", "error");
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));
      notifyUser(
        `Order placed successfully! Order #${Math.random().toString(36).substring(7).toUpperCase()}`,
        "success"
      );
      navigate("/u/marketplace/orders");
    } catch (error) {
      notifyUser("Payment failed. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
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
            onClick={() => navigate("/u/marketplace/cart")}
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
          <h1 className="text-4xl font-bold font-poppins">Secure Checkout</h1>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Shipping Information */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 font-poppins flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-green1 text-white flex items-center justify-center font-bold text-sm">
                    1
                  </span>
                  Shipping Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green1 focus:outline-none font-poppins"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green1 focus:outline-none font-poppins"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green1 focus:outline-none font-poppins"
                      placeholder="+234 801 234 5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
                      State *
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green1 focus:outline-none font-poppins"
                    >
                      <option value="">Select State</option>
                      <option value="Ebonyi">Ebonyi</option>
                      <option value="Lagos">Lagos</option>
                      <option value="FCT">FCT</option>
                      <option value="Rivers">Rivers</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
                      Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green1 focus:outline-none font-poppins"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green1 focus:outline-none font-poppins"
                      placeholder="Abakaliki"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green1 focus:outline-none font-poppins"
                      placeholder="123456"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Payment Method */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 font-poppins flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-green1 text-white flex items-center justify-center font-bold text-sm">
                    2
                  </span>
                  Payment Method
                </h2>

                <div className="space-y-3">
                  {/* Paystack */}
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-green1"
                    style={{
                      borderColor: paymentMethod === "paystack" ? "var(--green1)" : "#e5e7eb",
                    }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="paystack"
                      checked={paymentMethod === "paystack"}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as typeof paymentMethod)
                      }
                      className="w-4 h-4 accent-green1"
                    />
                    <div className="ml-4 flex-grow">
                      <p className="font-bold text-gray-900 font-poppins">Paystack Card Payment</p>
                      <p className="text-sm text-gray-600 font-poppins">
                        Secure payment with credit/debit card
                      </p>
                    </div>
                  </label>

                  {/* Bank Transfer */}
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-green1"
                    style={{
                      borderColor: paymentMethod === "transfer" ? "var(--green1)" : "#e5e7eb",
                    }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="transfer"
                      checked={paymentMethod === "transfer"}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as typeof paymentMethod)
                      }
                      className="w-4 h-4 accent-green1"
                    />
                    <div className="ml-4 flex-grow">
                      <p className="font-bold text-gray-900 font-poppins">Bank Transfer</p>
                      <p className="text-sm text-gray-600 font-poppins">
                        Direct transfer to seller{"'"}s account
                      </p>
                    </div>
                  </label>

                  {/* Credit Card */}
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-green1"
                    style={{
                      borderColor: paymentMethod === "card" ? "var(--green1)" : "#e5e7eb",
                    }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as typeof paymentMethod)
                      }
                      className="w-4 h-4 accent-green1"
                    />
                    <div className="ml-4 flex-grow">
                      <p className="font-bold text-gray-900 font-poppins">Credit/Debit Card</p>
                      <p className="text-sm text-gray-600 font-poppins">
                        Visa, Mastercard, or Verve
                      </p>
                    </div>
                  </label>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                type="submit"
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-green1 to-green2 text-white py-4 rounded-lg font-bold hover:shadow-lg hover:shadow-green1/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-poppins text-lg"
              >
                {isProcessing ? "Processing..." : `Pay ₦${total.toLocaleString()}`}
              </motion.button>
            </motion.form>
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

            {/* Items */}
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {cartItems.map((item: any) => (
                <div key={item.id} className="flex justify-between items-start text-sm">
                  <div>
                    <p className="font-semibold text-gray-900 line-clamp-1 font-poppins">
                      {item.title}
                    </p>
                    <p className="text-gray-600 text-xs font-poppins">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-gray-900">
                    ₦
                    {(
                      item.price *
                      (1 - item.discount_percentage / 100) *
                      item.quantity
                    ).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600 font-poppins">Subtotal</span>
                <span className="font-semibold">₦{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-poppins">Tax (7.5%)</span>
                <span className="font-semibold">₦{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-poppins">Shipping</span>
                <span className="font-semibold">
                  {shipping === 0 ? <span className="text-green-500">FREE</span> : `₦${shipping.toLocaleString()}`}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg text-gray-900 font-poppins">Total</span>
                <span className="font-bold text-2xl text-green1">
                  ₦{total.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800 font-poppins">
                💳 Your payment is secure and encrypted
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
