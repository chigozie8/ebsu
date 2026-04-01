import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import opportunitiesService from "../../../services/opportunitiesService";
import { Spinner } from "../../../components/loaders/Spinner";
import { Opportunity } from "../../../lib/supabase";

export const OpportunitiesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [opportunityType, setOpportunityType] = useState<"scholarship" | "internship" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "deadline-soon" | "popular">("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [featuredOpportunities, setFeaturedOpportunities] = useState<Opportunity[]>([]);

  useEffect(() => {
    const loadOpportunities = async () => {
      try {
        setIsLoading(true);
        const data = await opportunitiesService.getOpportunities({
          type: opportunityType !== "all" ? opportunityType : undefined,
          search: searchQuery || undefined,
          sortBy: sortBy,
        });
        setOpportunities(data);
      } catch (error) {
        console.error("[v0] Error loading opportunities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadOpportunities();
    }, 300);

    return () => clearTimeout(timer);
  }, [opportunityType, searchQuery, sortBy]);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const featured = await opportunitiesService.getFeaturedOpportunities();
        setFeaturedOpportunities(featured);
      } catch (error) {
        console.error("[v0] Error loading featured opportunities:", error);
      }
    };

    loadFeatured();
  }, []);

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const today = new Date();
    const daysLeft = Math.ceil((date.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysLeft < 0) return "Closed";
    if (daysLeft === 0) return "Today";
    if (daysLeft === 1) return "Tomorrow";
    if (daysLeft < 7) return `${daysLeft} days left`;
    return `${Math.ceil(daysLeft / 7)} weeks left`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white py-12 px-4"
      >
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold font-poppins mb-2">Scholarships & Internships</h1>
          <p className="text-blue-100 text-lg">Discover opportunities to advance your career</p>
        </div>
      </motion.div>

      {/* Featured Opportunities Carousel */}
      {featuredOpportunities.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold font-poppins mb-4 text-gray-900">Featured Opportunities</h2>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {featuredOpportunities.slice(0, 2).map((opp, index) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/u/opportunities/${opp.id}`)}
                className="cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-4 py-1 rounded-full text-sm font-bold text-white ${
                    opp.type === "scholarship" ? "bg-purple-500" : "bg-green-500"
                  }`}>
                    {opp.type.charAt(0).toUpperCase() + opp.type.slice(1)}
                  </span>
                  <span className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                    Featured
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 font-poppins mb-2">{opp.title}</h3>
                <p className="text-gray-700 mb-2">{opp.organization}</p>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{opp.description}</p>
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-blue-600">{opp.applications_count} applications</span>
                  <span className="text-xs font-bold text-red-600">{formatDeadline(opp.deadline)}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

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
              placeholder="Search opportunities by title, organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-600 focus:outline-none text-gray-700 placeholder-gray-400 shadow-sm transition-all"
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

        {/* Type & Sort Filters */}
        <div className="mb-8 flex flex-wrap gap-3 items-center justify-between">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-3"
          >
            {[
              { value: "all", label: "All" },
              { value: "scholarship", label: "Scholarships" },
              { value: "internship", label: "Internships" },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setOpportunityType(type.value as any)}
                className={`px-6 py-2 rounded-full font-medium font-poppins transition-all whitespace-nowrap ${
                  opportunityType === type.value
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-600"
                }`}
              >
                {type.label}
              </button>
            ))}
          </motion.div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 font-poppins bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="deadline-soon">Deadline Soon</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>

        {/* Opportunities List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
          </div>
        ) : opportunities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-500 text-lg font-poppins">No opportunities found. Try adjusting your filters.</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {opportunities.map((opp, index) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/u/opportunities/${opp.id}`)}
                className="group cursor-pointer bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-l-4 border-blue-500 hover:border-blue-600"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Content */}
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                        opp.type === "scholarship" ? "bg-purple-500" : "bg-green-500"
                      }`}>
                        {opp.type.charAt(0).toUpperCase() + opp.type.slice(1)}
                      </span>
                      <span className="text-sm font-semibold text-gray-600">{opp.organization}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 font-poppins group-hover:text-blue-600 transition-colors mb-2">
                      {opp.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{opp.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        <span className="font-bold text-gray-900">{opp.applications_count}</span> applications
                      </span>
                      <span className="text-gray-600">
                        <span className="font-bold text-gray-900">{opp.views_count}</span> views
                      </span>
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      formatDeadline(opp.deadline) === "Closed" ? "text-red-600" : "text-orange-600"
                    }`}>
                      {formatDeadline(opp.deadline)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(opp.deadline).toLocaleDateString()}
                    </p>
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
