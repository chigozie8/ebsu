import { useEffect, useState } from "react";
import { BadNetworkIcon } from "../icons/general/BadNetworkIcon";
import { playSound } from "../../hooks/useSound";

export default function NetworkBanner() {
  const [status, setStatus] = useState<"offline" | "restored" | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const handleOffline = () => {
      playSound("message");
      setStatus("offline");
    };

    const handleOnline = () => {
      playSound("notify");
      setStatus("restored");
      // Auto-dismiss the "back online" banner after 3 s
      timer = setTimeout(() => setStatus(null), 3000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      clearTimeout(timer);
    };
  }, []);

  if (!status) return null;

  const isOffline = status === "offline";

  return (
    <div
      role="status"
      aria-live="assertive"
      className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2.5 py-2.5 px-4 text-sm font-semibold transition-all duration-300 ${
        isOffline
          ? "bg-red-500 text-white"
          : "bg-green1 text-white"
      }`}
    >
      {isOffline ? (
        <>
          <BadNetworkIcon className="w-5 h-5 shrink-0 [&_path]:stroke-white" />
          <span>You are offline. Please check your internet connection.</span>
        </>
      ) : (
        <>
          {/* Green tick */}
          <svg
            viewBox="0 0 20 20"
            width="18"
            height="18"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <circle cx="10" cy="10" r="9" stroke="white" strokeWidth="1.8" />
            <path
              d="M6 10.5l3 3 5-5.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{"You're back online!"}</span>
        </>
      )}
    </div>
  );
}
