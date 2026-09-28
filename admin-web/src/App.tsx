import { useState } from "react";

import "./App.css";

import { AuthProvider } from "./auth/AuthContext";
import { useAuth } from "./auth/useAuth";

import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminOtp from "./pages/AdminOtp";

function AppContent() {
  const { isAuthenticated } = useAuth();

  const [phoneNumber, setPhoneNumber] =
    useState<string | null>(null);

  if (isAuthenticated) {
    return <AdminDashboard />;
  }

  if (phoneNumber !== null) {
    return (
      <AdminOtp
        phoneNumber={phoneNumber}
        onBack={() =>
          setPhoneNumber(null)
        }
      />
    );
  }

  return (
    <AdminLogin
      onOtpRequested={setPhoneNumber}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}