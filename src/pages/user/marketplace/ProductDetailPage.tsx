/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { notifyUser } from "../../../helpers/notifyUser";

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  verified_purchase: boolean;
  created_at: string;
}

const MOCK_PRODUCT = {
  id: "1",
  title: "Anatomy Textbook 2024 - Complete Edition",
  price: 15000,
  discount_percentage: 10,
  images: [
    "/placeholder.svg?height=400&width=400",
    "/placeholder.svg?height=400&width=400",
    "/placeholder.svg?height=400&width=400",
  ],
  rating: 4.5,
  review_count: 24,
  seller_name: "John Store",
  seller_rating: 4.7,
  seller_sales: 156,
  category: "Textbooks",
  description:
    "Brand new, comprehensive anatomy textbook covering all systems. Perfect for medical students preparing for exams. Very detailed illustrations and explanations. Comes with online access code.",
  stock_quantity: 5,
  seller_id: "seller_1",
  reviews: [
    {
      id: "1",
      reviewer_name: "Chioma A.",
      rating: 5,
      comment: "Excellent condition, very helpful for my exams. Highly recommended!",
      verified_purchase: true,
      created_at: "2024-03-15",
    },
    {
      id: "2",
      reviewer_name: "Tunde O.",
      rating: 4,
      comment: "Good quality but slightly different edition than expected. Still useful.",
      verified_purchase: true,
      created_at: "2024-03-10",
    },
    {
      id: "3",
      reviewer_name: "Ada C.",
      rating: 5,
      comment: "Seller was responsive and delivered on time. Excellent service!",
      verified_purchase: true,
      created_at: "2024-03-05",
    },
  ] as Review[],
};

export const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const product = MOCK_PRODUCT;
  const discountedPrice = product.price * (1 - product.discount_percentage / 100);

  const handleAddToCart = () => {
    setIsSaving(true);
    setTimeout(() => {
      notifyUser("Added to cart!", "success");
      setIsSaving(false);
    }, 500);
  };

  const handleBuyNow = () => {
    navigate("/u/marketplace/checkout", { state: { product, quantity } });
  };

  const handleContactSeller = () => {
    navigate(`/u/marketplace/chat/${product.seller_id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-12">
      {/* Navigation */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <button
          onClick={() => navigate("/u/marketplace")}
          className="text-green1 hover:text-green2 flex items-center gap-2 font-poppins transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Marketplace
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Image Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Main Image */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg mb-4 h-96">
              <img
                src={product.images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`rounded-lg overflow-hidden border-2 transition-all h-20 ${
                    selectedImage === index
                      ? "border-green1 ring-2 ring-green1/30"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img src={image} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Product Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Title & Rating */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-poppins mb-2">
                {product.title}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating) ? "text-yellow-400" : "text-gray-300"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-gray-700 font-poppins">
                  {product.rating} ({product.review_count} reviews)
                </span>
              </div>

              <p className="text-gray-600 font-poppins">{product.category}</p>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-green1/10 to-green2/10 rounded-lg p-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-green1">₦{discountedPrice.toLocaleString()}</span>
                {product.discount_percentage > 0 && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      ₦{product.price.toLocaleString()}
                    </span>
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      Save {product.discount_percentage}%
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600 font-poppins">
                {product.stock_quantity} items in stock
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 font-poppins">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-center border border-gray-300 rounded-lg py-2 font-poppins"
                  min="1"
                  max={product.stock_quantity}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <button
                onClick={handleBuyNow}
                className="w-full bg-gradient-to-r from-green1 to-green2 text-white py-3 rounded-lg font-bold hover:shadow-lg hover:shadow-green1/30 transition-all transform hover:-translate-y-0.5 font-poppins"
              >
                Buy Now
              </button>
              <button
                onClick={handleAddToCart}
                disabled={isSaving}
                className="w-full border-2 border-green1 text-green1 py-3 rounded-lg font-bold hover:bg-green1/5 transition-colors disabled:opacity-50 font-poppins"
              >
                {isSaving ? "Adding..." : "Add to Cart"}
              </button>
              <button
                onClick={handleContactSeller}
                className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors font-poppins"
              >
                Contact Seller
              </button>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 font-poppins">Seller Information</h3>
                  <p className="text-gray-600 font-poppins">{product.seller_name}</p>
                </div>
                <button className="text-green1 hover:text-green2 font-bold font-poppins">
                  View Store →
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm pt-3 border-t border-gray-200">
                <div>
                  <p className="text-gray-600 font-poppins">Rating</p>
                  <p className="font-bold text-gray-900">{product.seller_rating} ⭐</p>
                </div>
                <div>
                  <p className="text-gray-600 font-poppins">Sales</p>
                  <p className="font-bold text-gray-900">{product.seller_sales}</p>
                </div>
              </div>
            </div>

            {/* Product Description */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2 font-poppins">Description</h3>
              <p className="text-gray-600 leading-relaxed font-poppins">{product.description}</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 font-poppins">Customer Reviews</h2>
          <div className="space-y-4">
            {product.reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-gray-900 font-poppins">{review.reviewer_name}</h4>
                    {review.verified_purchase && (
                      <span className="inline-block mt-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-poppins">
                        ✓ Verified Purchase
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500 font-poppins">{review.created_at}</span>
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating ? "text-yellow-400" : "text-gray-300"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <p className="text-gray-700 font-poppins">{review.comment}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
