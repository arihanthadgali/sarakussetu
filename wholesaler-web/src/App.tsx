import { useState } from "react";

import { useAuth } from "./auth/useAuth";
import OtpVerification from "./pages/OtpVerification";
import WholesalerDashboard from "./pages/WholesalerDashboard";
import WholesalerLogin from "./pages/WholesalerLogin";
import WholesalerOrderHistory from "./pages/WholesalerOrderHistory";
import WholesalerOrders from "./pages/WholesalerOrders";
import WholesalerSignup from "./pages/WholesalerSignup";
import type { WholesalerPage } from "./components/WholesalerSidebar";

type AuthMode = "signin" | "register";

function App() {
  const { isAuthenticated, isLoading, login, logout } = useAuth();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [signupToken, setSignupToken] = useState<string | null>(null);
  const [activePage, setActivePage] =
    useState<WholesalerPage>("dashboard");

  if (isLoading) {
    return (
      <main className="auth-page">
        <div className="auth-card">Loading...</div>
      </main>
    );
  }

  if (isAuthenticated) {
    if (activePage === "orders") {
      return (
        <WholesalerOrders
          onNavigate={setActivePage}
          onLogout={logout}
        />
      );
    }

    if (activePage === "history") {
      return (
        <WholesalerOrderHistory
          onNavigate={setActivePage}
          onLogout={logout}
        />
      );
    }

    return (
      <WholesalerDashboard
        onNavigate={setActivePage}
        onLogout={logout}
      />
    );
  }

  if (signupToken !== null) {
    return (
      <WholesalerSignup
        signupToken={signupToken}
        onCompleted={login}
        onBack={() => {
          setSignupToken(null);
          setPhoneNumber(null);
          setMode("register");
        }}
      />
    );
  }

  if (phoneNumber !== null) {
    return (
      <OtpVerification
        phoneNumber={phoneNumber}
        mode={mode}
        onBack={() => setPhoneNumber(null)}
        onVerified={login}
        onSignupRequired={(token) => {
          setSignupToken(token);
        }}
      />
    );
  }

  return (
    <WholesalerLogin
      mode={mode}
      onChangeMode={setMode}
      onOtpRequested={(phone, selectedMode) => {
        setPhoneNumber(phone);
        setMode(selectedMode);
      }}
    />
  );
}

export default App;