import React, { useEffect, useState } from "react";
import { AppState, User } from "./types";
import { INITIAL_DATA, loadAppStateFromFirebase, saveAppStateToFirebase } from "./state/appState";

import Header from "./components/Header";
import AuthView from "./auth/AuthView";
import AdminPanel from "./admin/AdminPanel";

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(INITIAL_DATA);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<"auth" | "admin" | "campaigns" | "wallet">("auth");

  useEffect(() => {
    loadAppStateFromFirebase().then(d => d && setAppState(d));
  }, []);

  useEffect(() => {
    saveAppStateToFirebase(appState);
  }, [appState]);

  if (currentView === "auth") return <AuthView />;

  return (
    <>
      <Header user={currentUser} />
      {currentView === "admin" && (
        <AdminPanel appState={appState} setAppState={setAppState} />
      )}
    </>
  );
};

export default App;
