/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import marketplaceService from "../../../services/marketplaceService";
import { Spinner } from "../../../components/loaders/Spinner";
import { MarketplaceProduct } from "../../../lib/supabase";

const CATEGORIES = [
  "All",
  "Textbooks",
  "Electronics",
  "Course Notes",
  "Past Papers",
  "Study Materials",
  "Laptops & Gadgets",
  "Stationery",
  "Other",
];

export const MarketplacePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high" | "popular">("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState<MarketplaceProduct[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const products = await marketplaceService.getProducts({
          category: selectedCategory !== "All" ? selectedCategory : undefined,
          search: searchQuery || undefined,
          sortBy: sortBy,
        });
        setFilteredProducts(products);
      } catch (error) {
        console.error("[v0] Error loading products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green1 via-green2 to-green3 text-white py-12 px-4"
      >
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold font-poppins mb-2">Student Marketplace</h1>
          <p className="text-green100 text-lg">Buy and sell textbooks, notes, electronics & more</p>
        </div>
      </motion.div>

      {/* Search & Filter Section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-3 rounded-lg border-2 border-gray-200 focus:border-green1 focus:outline-none text-gray-700 placeholder-gray-400 shadow-sm transition-all"
            />
            <svg
              className="absolute right-4 top-3.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </motion.div>

        {/* Category Filter & Sort */}
        <div className="mb-8 flex flex-wrap gap-3 items-center justify-between">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-3"
          >
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-medium font-poppins transition-all whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-green1 text-white shadow-lg shadow-green1/30"
                    : "bg-white text-gray-700 border-2 border-gray-200 hover:border-green1"
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green1 font-poppins bg-white"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
          </div>
        ) : filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-500 text-lg font-poppins">No products found</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/u/marketplace/product/${product.id}`)}
                className="group cursor-pointer"
              >
                <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                  {/* Product Image */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    <img
                      src={product.images?.[0] || "/placeholder.svg?height=200&width=200"}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {product.discount_percentage && product.discount_percentage > 0 && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        -{product.discount_percentage}%
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-green1 transition-colors font-poppins">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 font-poppins truncate">
                      {product.seller?.shop_name || "Anonymous Seller"}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center gap-1 my-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating || 0)
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-1">
                        ({product.review_count || 0})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="mt-auto pt-2 border-t border-gray-100">
                      <p className="text-2xl font-bold text-green1 font-poppins">
                        ₦{(product.price * (1 - (product.discount_percentage || 0) / 100)).toLocaleString()}
                      </p>
                      {product.discount_percentage && product.discount_percentage > 0 && (
                        <p className="text-sm text-gray-500 line-through">
                          ₦{product.price.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};
