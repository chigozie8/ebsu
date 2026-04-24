import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminAdsManager from "./AdminAdsManager";
import AdminBannerManager from "./AdminBannerManager";

type MarketingSubTab = "popup-ads" | "hanging-banner";

const SUB_TABS: { id: MarketingSubTab; label: string; icon: JSX.Element; desc: string }[] = [
  {
    id: "popup-ads",
    label: "Popup Ads",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
    desc: "Create and manage banner ads visible to students. Set placement to Popup or All Pages for the popup to appear.",
  },
  {
    id: "hanging-banner",
    label: "Hanging Banner",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    desc: "Create 3D hanging banners with Christmas lights shown at the top of the home page.",
  },
];

export default function AdminMarketingManager() {
  const [activeSubTab, setActiveSubTab] = useState<MarketingSubTab>("popup-ads");

  const currentTab = SUB_TABS.find((t) => t.id === activeSubTab)!;

  return (
    <div className="space-y-6">
      {/* Sub-tab selector */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-2">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`relative flex items-center gap-3 px-5 py-4 text-left transition-all ${
                activeSubTab === tab.id
                  ? tab.id === "popup-ads"
                    ? "bg-rose-600 text-white"
                    : "bg-[#00875a] text-white"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span
                className={`flex-shrink-0 p-2 rounded-xl ${
                  activeSubTab === tab.id ? "bg-white/20" : "bg-white border border-gray-200"
                }`}
              >
                <span className={activeSubTab === tab.id ? "text-white" : "text-gray-500"}>
                  {tab.icon}
                </span>
              </span>
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight">{tab.label}</p>
                <p
                  className={`text-xs mt-0.5 leading-snug hidden sm:block ${
                    activeSubTab === tab.id ? "text-white/80" : "text-gray-400"
                  }`}
                >
                  {tab.desc}
                </p>
              </div>
              {activeSubTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/40" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Important notice for popup ads */}
      {activeSubTab === "popup-ads" && (
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">For popup to show on the home page</p>
            <p className="text-xs text-amber-700 mt-1">
              When creating an ad, set the <strong>Placement</strong> to <strong>"Popup Only"</strong> or <strong>"All Pages"</strong>, and make sure the ad is <strong>Active</strong>. The popup appears automatically 5 seconds after the page loads.
            </p>
          </div>
        </div>
      )}

      {/* Important notice for hanging banner */}
      {activeSubTab === "hanging-banner" && (
        <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-800">How the hanging banner works</p>
            <p className="text-xs text-blue-700 mt-1">
              Create a banner below, then click <strong>Inactive</strong> to toggle it <strong>Active</strong>. Only one banner can be active at a time. It drops from the top of the home page with Christmas lights and sways until its duration ends. Make sure the <code className="bg-blue-100 px-1 rounded">hanging_banners</code> table exists in your Supabase database.
            </p>
          </div>
        </div>
      )}

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeSubTab === "popup-ads" && <AdminAdsManager />}
          {activeSubTab === "hanging-banner" && <AdminBannerManager />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
