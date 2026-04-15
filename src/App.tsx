import AppRoutes from "./routes";
import ErrorBoundary from "./pages/error/error-boundry/ErrorBoundary";
import { CustomToaster } from "./components/toast/CustomToaster";
import AppProvider from "./provider";
import { AIChatbot } from "./components/chatbot/AIChatbot";
import PWAInstallPrompt from "./components/pwa/PWAInstallPrompt";
import NetworkBanner from "./components/network/NetworkBanner";
import PromoToast from "./components/promo/PromoToast";

export default function App() {
  return (
    <>
      <ErrorBoundary>
        <AppProvider>
          <NetworkBanner />
          <AppRoutes />
          <CustomToaster />
          <AIChatbot />
          <PWAInstallPrompt />
          <PromoToast />
        </AppProvider>
      </ErrorBoundary>
    </>
  );
}
