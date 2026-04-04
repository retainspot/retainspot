import React, { useState, useEffect } from "react";
import "./App.css";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";
import Registration from "./pages/Registration";
import Home from "./pages/Home";
import CustomerSupport from "./pages/CustomerSupport";
import { auth } from "./FirebaseAuth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { app } from "./FirebaseAuth";

const db = getFirestore(app);

function App() {
  const [user, setUser]                     = useState(null);
  const [userProfile, setUserProfile]       = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab]           = useState("Dashboard");
  const [publicPage, setPublicPage]         = useState("Home");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          // Step 1: Check users collection
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));

          if (userDoc.exists()) {
            const profile = userDoc.data();

            if (profile.companyId) {
              const companyDoc = await getDoc(doc(db, "companies", profile.companyId));
              if (companyDoc.exists()) {
                profile.companyName = companyDoc.data().name;
              }
            }

            setUserProfile(profile);

          } else {
            // Step 2: Fallback to subAccounts
            const q = query(
              collection(db, "subAccounts"),
              where("uid", "==", currentUser.uid)
            );

            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
              const profile = snapshot.docs[0].data();

              if (profile.companyId) {
                const companyDoc = await getDoc(doc(db, "companies", profile.companyId));
                if (companyDoc.exists()) {
                  profile.companyName = companyDoc.data().name;
                }
              }

              setUserProfile(profile);
            } else {
              setUserProfile(null); // super admin
            }
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setProfileLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.log(error);
    }
  };

  if (profileLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f2fa",
      }}>
        <div style={{
          width: 36,
          height: 36,
          border: "4px solid #ede9fe",
          borderTopColor: "#5b21f4",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    if (publicPage === "Home")    return <Home setPublicPage={setPublicPage} />;
    if (publicPage === "Support") return <CustomerSupport setPublicPage={setPublicPage} />;
    if (publicPage === "Login")   return <Registration setPublicPage={setPublicPage} />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case "Dashboard":
        return <Dashboard />;

      case "Customers":
        return <Customers />;

      case "Messages":
        return <Messages user={user} userProfile={userProfile} />;

      case "Settings":
        return <Settings user={user} userProfile={userProfile} />;

      default:
        return (
          <div style={{ padding: "32px" }}>
            <h2 style={{ color: "#1e1b3a", marginBottom: "8px" }}>
              {activeTab}
            </h2>
            <p style={{ color: "#9ca3af" }}>
              This page is coming soon...
            </p>
          </div>
        );
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      user={user}
      handleLogout={handleLogout}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;