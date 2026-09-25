import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import MainLayout from "./components/layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import UserProfile from "./pages/UserProfile";
import Branches from "./pages/Branches";
import BranchDetails from "./pages/BranchDetails";
import BranchServices from "./pages/BranchServices";
import Services from "./pages/Services";
import Settings from "./pages/Settings";
import CompanyMail from "./pages/CompanyMail";
import WpSystemTemplates from "./pages/WpSystemTemplates";
import SmsSystemConfig from "./pages/SmsSystemConfig";
import SmsSystemTemplates from "./pages/SmsSystemTemplates";
import CallSystemConfig from "./pages/CallSystemConfig";
import RazorpayConfig from "./pages/RazorpayConfig";
import WalletPayments from "./pages/WalletPayments";
import HelpSupportConfig from "./pages/HelpSupportConfig";
import WebsiteContactConfig from "./pages/WebsiteContactConfig";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ServerUnreachable from "./pages/ServerUnreachable";

function ThemedToasts() {
  const { isDark } = useTheme();
  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={isDark ? "dark" : "light"}
    />
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <ThemedToasts />

            <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route path="/server-error" element={<ServerUnreachable />} />

            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Navigate to="/" replace />} />

              <Route path="users" element={<Users />} />
              <Route path="user/profile/:username" element={<UserProfile />} />

              <Route path="branches" element={<Branches />} />
              <Route path="branch/:branchId" element={<BranchDetails />} />
              <Route path="branch/:branchId/services" element={<BranchServices />} />

              <Route path="services" element={<Services />} />

              <Route path="settings" element={<Settings />} />
              <Route path="settings/mail" element={<CompanyMail />} />
              <Route path="settings/wp-system-templates" element={<WpSystemTemplates />} />
              <Route path="settings/sms-system-config" element={<SmsSystemConfig />} />
              <Route path="settings/sms-system-templates" element={<SmsSystemTemplates />} />
              <Route path="settings/call-system-config" element={<CallSystemConfig />} />
              <Route path="settings/razorpay" element={<RazorpayConfig />} />
              <Route path="settings/wallet-payments" element={<WalletPayments />} />
              <Route path="settings/help-support" element={<HelpSupportConfig />} />
              <Route path="settings/website-contact" element={<WebsiteContactConfig />} />
              <Route path="profile" element={<Profile />} />

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
