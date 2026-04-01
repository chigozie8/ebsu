/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { notifyUser } from "../../../helpers/notifyUser";

const MOCK_OPPORTUNITY = {
  id: "1",
  title: "Google Africa Scholarship 2024",
  type: "scholarship" as const,
  organization: "Google",
  deadline: "2024-04-30",
  featured: true,
  applications_count: 1240,
  views_count: 5600,
  eligibility: "African students, strong academic record",
  description: `
    The Google Africa Scholarship is a prestigious program designed to support exceptional African students
    pursuing degrees in computer science or related fields. This scholarship provides financial support for
    tuition, accommodation, and living expenses.

    Successful recipients will also receive:
    - Full tuition coverage for 4 years
    - Monthly stipend for living expenses
    - Internship opportunities at Google offices
    - Mentorship from Google professionals
    - Networking events with industry leaders
  `,
  requirements: [
    "Currently enrolled in a computer science or related degree program",
    "Minimum 3.5 GPA or equivalent",
    "Strong academic performance in previous semesters",
    "Evidence of leadership and community involvement",
    "Fluency in English",
    "Must be an African citizen or permanent resident",
  ],
  benefits: [
    "Full tuition coverage",
    "Monthly living allowance",
    "Internship opportunities",
    "Professional mentorship",
    "Travel and accommodation",
    "Career development support",
  ],
  applicationSteps: [
    "Create your online application profile",
    "Submit your academic transcript and CV",
    "Write a personal statement (500-750 words)",
    "Provide 2-3 letters of recommendation",
    "Complete technical assessment",
    "Attend final interview (if selected)",
  ],
  postedDate: "2024-03-01",
  applicationUrl: "https://google.com/scholarship/apply",
};

export const OpportunityDetailPage = () => {
  const { opportunityId } = useParams();
  const navigate = useNavigate();
  const [hasApplied, setHasApplied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const opportunity = MOCK_OPPORTUNITY;

  const handleApply = () => {
    setIsSaving(true);
    setTimeout(() => {
      setHasApplied(true);
      notifyUser("Application submitted successfully!", "success");
      setIsSaving(false);
    }, 1000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const daysUntilDeadline = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr);
    const today = new Date();
    const diff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-12">
      {/* Navigation */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <button
          onClick={() => navigate("/u/opportunities")}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 font-poppins transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Opportunities
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-8"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                        opportunity.type === "scholarship"
                          ? "bg-purple-500"
                          : "bg-green-500"
                      }`}
                    >
                      {opportunity.type === "scholarship"
                        ? "🎓 SCHOLARSHIP"
                        : "💼 INTERNSHIP"}
                    </span>
                    {opportunity.featured && (
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 font-poppins mb-2">
                    {opportunity.title}
                  </h1>
                  <p className="text-xl text-gray-600 font-poppins">
                    {opportunity.organization}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    {daysUntilDeadline(opportunity.deadline)}d
                  </p>
                  <p className="text-gray-600 font-poppins">days left</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-200 my-4">
                <div>
                  <p className="text-sm text-gray-600 font-poppins">Views</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {opportunity.views_count.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-poppins">Applications</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {opportunity.applications_count}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-poppins">Posted</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatDate(opportunity.postedDate)}
                  </p>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed font-poppins mt-4">
                {opportunity.eligibility}
              </p>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 20 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg border border-gray-200 p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-poppins">
                About This Opportunity
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-poppins">
                {opportunity.description}
              </p>
            </motion.div>

            {/* Requirements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 20 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg border border-gray-200 p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-poppins">
                Requirements
              </h2>
              <ul className="space-y-3">
                {opportunity.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold text-lg mt-1">✓</span>
                    <span className="text-gray-700 font-poppins">{req}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 20 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg border border-gray-200 p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-poppins">
                Benefits
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opportunity.benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg"
                  >
                    <span className="text-2xl">🎁</span>
                    <span className="text-gray-700 font-poppins">{benefit}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Application Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 20 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg border border-gray-200 p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 font-poppins">
                Application Process
              </h2>
              <div className="space-y-4">
                {opportunity.applicationSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="pt-2">
                      <p className="text-gray-700 font-poppins">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Apply Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg p-6 sticky top-4">
              <h3 className="text-2xl font-bold mb-2 font-poppins">Ready to Apply?</h3>
              <p className="text-blue-100 text-sm mb-6 font-poppins">
                Deadline: {formatDate(opportunity.deadline)}
              </p>

              {hasApplied ? (
                <div className="bg-green-100 text-green-700 p-4 rounded-lg text-center font-bold font-poppins mb-4">
                  ✓ Application Submitted
                </div>
              ) : null}

              <button
                onClick={handleApply}
                disabled={isSaving || hasApplied}
                className={`w-full py-3 rounded-lg font-bold transition-all transform hover:-translate-y-0.5 font-poppins ${
                  hasApplied
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-white text-blue-600 hover:shadow-lg hover:shadow-blue-600/30"
                }`}
              >
                {isSaving ? "Applying..." : hasApplied ? "Applied" : "Apply Now"}
              </button>

              <button
                onClick={() => window.open(opportunity.applicationUrl)}
                className="w-full mt-3 border-2 border-white text-white py-2 rounded-lg font-bold hover:bg-white/10 transition-colors font-poppins"
              >
                External Application →
              </button>

              <div className="mt-6 pt-6 border-t border-blue-400 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  <div>
                    <p className="text-xs text-blue-100 font-poppins">Deadline</p>
                    <p className="font-bold font-poppins">
                      {formatDate(opportunity.deadline)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">👥</span>
                  <div>
                    <p className="text-xs text-blue-100 font-poppins">Applicants</p>
                    <p className="font-bold font-poppins">
                      {opportunity.applications_count}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Share Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4 font-poppins">Share</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-poppins">
                  <span>📱</span> Share on WhatsApp
                </button>
                <button className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-poppins">
                  <span>📘</span> Share on Facebook
                </button>
                <button className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-poppins">
                  <span>🐦</span> Share on Twitter
                </button>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4 font-poppins">
                Organization
              </h3>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl mx-auto mb-3">
                  G
                </div>
                <p className="font-bold text-gray-900 font-poppins mb-2">
                  {opportunity.organization}
                </p>
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-700 text-sm font-bold font-poppins"
                >
                  Visit Website →
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
