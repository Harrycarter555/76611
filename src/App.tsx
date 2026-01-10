import React, { useEffect, useState } from "react";
import { onAuthChange, logout } from "./auth/authService";
import { getUserProfile } from "./state/userProfile";
import Header from "./components/Header";
import AuthView from "./auth/AuthView";
import AdminPanel from "./admin/AdminPanel";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    return onAuthChange(async (u) => {
      setFirebaseUser(u);
      if (u) {
        const p = await getUserProfile(u.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
    });
  }, []);

  if (!firebaseUser) return <AuthView />;

  return (
    <>
      <Header user={firebaseUser} onLogout={logout} />
      
      <ProtectedRoute allow={profile?.role === "ADMIN"}>
        <AdminPanel />
      </ProtectedRoute>
    </>
  );
};

export default App;
