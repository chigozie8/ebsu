/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { notifyUser } from "../../../helpers/notifyUser";

interface SellerProduct {
  id: string;
  title: string;
  price: number;
  stock_quantity: number;
  rating: number;
  review_count: number;
  views_count: number;
  status: "active" | "inactive";
  created_at: string;
  sales_count: number;
}

const MOCK_SELLER_PRODUCTS: SellerProduct[] = [
  {
    id: "1",
    title: "Anatomy Textbook 2024",
    price: 15000,
    stock_quantity: 3,
    rating: 4.5,
    review_count: 24,
    views_count: 156,
    status: "active",
    created_at: "2024-03-01",
    sales_count: 12,
  },
  {
    id: "2",
    title: "Pharmacology Notes",
    price: 5000,
    stock_quantity: 10,
    rating: 4.8,
    review_count: 45,
    views_count: 302,
    status: "active",
    created_at: "2024-02-15",
    sales_count: 28,
  },
];

export const SellerDashboardPage = () => {
  const navigate = useNavigate();
  const [products] = useState<SellerProduct[]>(MOCK_SELLER_PRODUCTS);
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "analytics">(
    "overview"
  );

  const totalSales = products.reduce((sum, p) => sum + p.sales_count, 0);
  const totalViews = products.reduce((sum, p) => sum + p.views_count, 0);
  const totalRevenue = products.reduce(
    (sum, p) => sum + p.price * p.sales_count,
    0
  );
  const averageRating =
    products.reduce((sum, p) => sum + p.rating, 0) / products.length;

  const stats = [
    {
      label: "Total Sales",
      value: totalSales,
      icon: "📊",
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Total Revenue",
      value: `₦${(totalRevenue / 1000).toFixed(1)}k`,
      icon: "💰",
      color: "from-green-500 to-green-600",
    },
    {
      label: "Total Views",
      value: totalViews.toLocaleString(),
      icon: "👁️",
      color: "from-purple-500 to-purple-600",
    },
    {
      label: "Avg Rating",
      value: averageRating.toFixed(1),
      icon: "⭐",
      color: "from-yellow-500 to-yellow-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green1 via-green2 to-green3 text-white py-12 px-4"
      >
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold font-poppins mb-2">Seller Dashboard</h1>
          <p className="text-green100">Manage your products and track sales</p>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className={`bg-gradient-to-br ${stat.color} text-white rounded-lg p-6 shadow-lg`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-4xl">{stat.icon}</span>
              </div>
              <p className="text-white/80 text-sm font-poppins mb-1">{stat.label}</p>
              <p className="text-3xl font-bold font-poppins">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4 mb-8 border-b border-gray-200"
        >
          {["overview", "products", "analytics"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 font-bold font-poppins transition-all border-b-2 ${
                activeTab === tab
                  ? "border-green1 text-green1"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 font-poppins">
                  Recent Activity
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      ✓
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 font-poppins">
                        Order Completed
                      </p>
                      <p className="text-sm text-gray-600 font-poppins">
                        Order #SKU123 delivered
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      ⭐
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 font-poppins">
                        New Review
                      </p>
                      <p className="text-sm text-gray-600 font-poppins">
                        5-star review on Anatomy Book
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      💬
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 font-poppins">
                        New Message
                      </p>
                      <p className="text-sm text-gray-600 font-poppins">
                        Customer inquiry about stock
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 font-poppins">
                  Store Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 font-poppins">Store Name</p>
                    <p className="font-semibold text-gray-900 font-poppins">
                      John Electronics
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-poppins">Verification</p>
                    <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold font-poppins">
                      ✓ Verified
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-poppins">Join Date</p>
                    <p className="font-semibold text-gray-900 font-poppins">
                      January 15, 2024
                    </p>
                  </div>
                  <button className="w-full mt-4 bg-green1 text-white py-2 rounded-lg font-bold hover:bg-green2 transition-colors font-poppins">
                    Edit Store
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <button
              onClick={() => navigate("/u/marketplace/seller/add-product")}
              className="bg-gradient-to-r from-green1 to-green2 text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all"
            >
              + Add New Product
            </button>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 font-poppins">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 font-poppins">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 font-poppins">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 font-poppins">
                      Sales
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 font-poppins">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 font-poppins">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 font-poppins">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 line-clamp-1 font-poppins">
                          {product.title}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-poppins">
                        ₦{product.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-poppins">
                        {product.stock_quantity}
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-poppins">
                        {product.sales_count}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-yellow-500">⭐ {product.rating}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold font-poppins ${
                            product.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-green1 hover:text-green2 font-semibold font-poppins">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 font-poppins">
                Sales Trend (Last 7 Days)
              </h2>
              <div className="h-48 bg-gradient-to-b from-green-100 to-transparent rounded-lg flex items-end justify-around px-4">
                {[12, 19, 8, 15, 22, 18, 20].map((sales, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div
                      className="bg-green1 rounded-t"
                      style={{ width: "20px", height: `${sales * 5}px` }}
                    ></div>
                    <span className="text-xs text-gray-600 font-poppins">
                      {String.fromCharCode(65 + i)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 font-poppins">
                Top Products
              </h2>
              <div className="space-y-4">
                {products
                  .sort((a, b) => b.sales_count - a.sales_count)
                  .map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 line-clamp-1 font-poppins">
                        {product.title}
                      </p>
                      <span className="font-bold text-green1">
                        {product.sales_count} sales
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
