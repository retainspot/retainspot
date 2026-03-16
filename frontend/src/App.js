import React, { useState, useEffect } from "react";
import "./App.css";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Registration from "./pages/Registration";
import Home from "./pages/Home";
import CustomerSupport from "./pages/CustomerSupport";
import { auth } from "./FirebaseAuth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Papa from "papaparse";

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");   // post-login tabs
  const [publicPage, setPublicPage] = useState("Home");       // pre-login pages
  const [customersData, setCustomersData] = useState([]);

  // ── Auth listener ──────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log(error);
    }
  };

  // ── Chart data ─────────────────────────────────────────
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

  // ── CSV load ───────────────────────────────────────────
  useEffect(() => {
    Papa.parse("/cleaned_telco.csv", {
      download: true,
      header: true,
      complete: (results) => setCustomersData(results.data),
      error: (err) => console.error("Error loading CSV:", err),
    });
  }, []);

  // ── PRE-LOGIN: public site ─────────────────────────────
  if (!user) {
    if (publicPage === "Home") {
      return <Home setPublicPage={setPublicPage} />;
    }
    if (publicPage === "Support") {
      return <CustomerSupport setPublicPage={setPublicPage} />;
    }
    if (publicPage === "Login") {
      return <Registration setPublicPage={setPublicPage} />;
    }
  }

  // ── POST-LOGIN: dashboard ──────────────────────────────
  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      user={user}
      handleLogout={handleLogout}
    >
      {activeTab === "Dashboard" ? (
        <Dashboard
          visitorData={visitorData}
          revenueData={revenueData}
          pieData={pieData}
          satisfactionData={satisfactionData}
        />
      ) : activeTab === "Customers" ? (
        <Customers customers={customersData} />
      ) : (
        <div style={{ padding: "20px" }}>
          Content for {activeTab} coming soon...
        </div>
      )}
    </Layout>
  );
}

export default App;