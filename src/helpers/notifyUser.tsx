import toast from "react-hot-toast";
import { BlueInfoIcon } from "../components/icons/general/BlueInfoIcon";
import { Spinner } from "../components/loaders/Spinner";
import { playSound } from "../hooks/useSound";

/**
 * Sanitize error messages to hide technical details like URLs, file paths, and error codes
 * Provides user-friendly error messages while logging technical details to console
 */
const sanitizeErrorMessage = (message: string | null | undefined): string => {
  if (!message) return "Something went wrong. Please try again.";
  
  const messageStr = String(message);
  
  // Check for dynamic import/chunk loading errors
  if (messageStr.includes("Failed to fetch") || messageStr.includes(".js") || messageStr.includes("assets/")) {
    console.error("[v0] Technical Error:", messageStr);
    return "Failed to load resources. Please refresh the page.";
  }
  
  // Check for CORS errors
  if (messageStr.includes("CORS") || messageStr.includes("cross-origin")) {
    console.error("[v0] Technical Error:", messageStr);
    return "Unable to connect to the service. Please check your connection.";
  }
  
  // Check for network errors
  if (messageStr.includes("Network error") || messageStr.includes("network")) {
    console.error("[v0] Technical Error:", messageStr);
    return "Network connection error. Please check your internet connection.";
  }
  
  // Check for 404 errors
  if (messageStr.includes("404") || messageStr.includes("not found")) {
    console.error("[v0] Technical Error:", messageStr);
    return "Resource not found. Please try again.";
  }
  
  // Check for 500 errors
  if (messageStr.includes("500") || messageStr.includes("server error")) {
    console.error("[v0] Technical Error:", messageStr);
    return "Server error. Please try again later.";
  }
  
  // Check for long error messages with URLs
  if (messageStr.length > 200 && (messageStr.includes("http") || messageStr.includes("/"))) {
    console.error("[v0] Technical Error:", messageStr);
    return "An error occurred. Please try again.";
  }
  
  // Return original message if it looks user-friendly
  return messageStr;
};

export const notifyUser = (
  state: "success" | "error" | "info" | "loading",
  message?: string | null
) => {
  const displayMessage = state === "error" ? sanitizeErrorMessage(message) : message;
  
  if (state === "error") {
    playSound("message");
    return toast.error(<p className="notification-message">{displayMessage}</p>);
  } else if (state === "success") {
    playSound("notify");
    return toast.success(<p className="notification-message">{displayMessage}</p>);
  } else if (state === "info") {
    playSound("message");
    return toast(<p className="notification-message">{displayMessage}</p>, {
      icon: <BlueInfoIcon className="w-5 h-5" />,
    });
  } else if (state === "loading") {
    // No sound for loading — user triggered it themselves
    return toast(<p className="notification-message">{displayMessage}</p>, {
      icon: <Spinner className="w-4 h-4 fill-gray-400" />,
    });
  }
};
