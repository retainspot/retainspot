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
import Papa from "papaparse";

const db = getFirestore(app);

function App() {
  const [user, setUser]                     = useState(null);
  const [userProfile, setUserProfile]       = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab]           = useState("Dashboard");
  const [publicPage, setPublicPage]         = useState("Home");
  const [customersData, setCustomersData]   = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          // ── Step 1: Try users collection first ──────────
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));

          if (userDoc.exists()) {
            const profile = userDoc.data();
            // Fetch company name
            if (profile.companyId) {
              const companyDoc = await getDoc(doc(db, "companies", profile.companyId));
              if (companyDoc.exists()) {
                profile.companyName = companyDoc.data().name;
              }
            }
            setUserProfile(profile);

          } else {
            // ── Step 2: Fallback to subAccounts ───────────
            // Only match by uid field (not email) to avoid picking up wrong docs
            const q = query(
              collection(db, "subAccounts"),
              where("uid", "==", currentUser.uid)
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
              const profile = snapshot.docs[0].data();
              // Fetch company name
              if (profile.companyId) {
                const companyDoc = await getDoc(doc(db, "companies", profile.companyId));
                if (companyDoc.exists()) {
                  profile.companyName = companyDoc.data().name;
                }
              }
              setUserProfile(profile);
            } else {
              // No profile = super admin
              setUserProfile(null);
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

  const visitorData = [
    { month: "Jan", loyal: 20, new: 35, unique: 45 },
    { month: "Feb", loyal: 35, new: 25, unique: 35 },
    { month: "Mar", loyal: 30, new: 40, unique: 50 },
    { month: "Apr", loyal: 45, new: 30, unique: 40 },
    { month: "May", loyal: 40, new: 50, unique: 60 },
    { month: "Jun", loyal: 55, new: 45, unique: 55 },
  ];

  const revenueData = [
    { day: "Mon", online: 15, offline: 12 },
    { day: "Tue", online: 18, offline: 10 },
    { day: "Wed", online: 10, offline: 22 },
    { day: "Thu", online: 17, offline: 11 },
    { day: "Fri", online: 12, offline: 13 },
    { day: "Sat", online: 14, offline: 16 },
    { day: "Sun", online: 21, offline: 11 },
  ];

  const pieData = [
    { name: "Direct", value: 400, color: "#0095FF" },
    { name: "Social", value: 300, color: "#00E096" },
    { name: "Email",  value: 300, color: "#8884d8" },
    { name: "Ads",    value: 200, color: "#FFCF00" },
  ];

  const satisfactionData = [
    { name: "Week 1", value: 40 },
    { name: "Week 2", value: 70 },
    { name: "Week 3", value: 50 },
    { name: "Week 4", value: 90 },
  ];

  useEffect(() => {
    Papa.parse("/cleaned_telco.csv", {
      download: true,
      header: true,
      complete: (results) => setCustomersData(results.data),
      error: (err) => console.error("Error loading CSV:", err),
    });
  }, []);

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
          width: 36, height: 36,
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
        return (
          <Dashboard
            visitorData={visitorData}
            revenueData={revenueData}
            pieData={pieData}
            satisfactionData={satisfactionData}
          />
        );
      case "Customers":
        return <Customers customers={customersData} />;
      case "Messages":
        return <Messages user={user} userProfile={userProfile} />;
      case "Settings":
        return <Settings user={user} userProfile={userProfile} />;
      default:
        return (
          <div style={{ padding: "32px" }}>
            <h2 style={{ color: "#1e1b3a", marginBottom: "8px" }}>{activeTab}</h2>
            <p style={{ color: "#9ca3af" }}>This page is coming soon...</p>
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