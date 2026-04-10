import React, { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../FirebaseAuth"; // adjust path

const Sidebar = ({ activeTab, setActiveTab, user, handleLogout }) => {
  // ✅ Hooks must be inside the component
  const [role, setRole] = useState("Loading...");

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;

      try {
        // ✅ Fetch user directly by document ID (Auth UID)
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const docData = userDocSnap.data();
          setRole(docData.role); // role from users collection
          return;
        }

        // ✅ If not in users, check subAccounts by uid
        const subRef = collection(db, "subAccounts");
        const q2 = query(subRef, where("uid", "==", user.uid));
        const subSnap = await getDocs(q2);

        if (!subSnap.empty) {
          const docData = subSnap.docs[0].data();
          setRole(docData.role);
        } else {
          setRole("No Role");
        }
      } catch (error) {
        console.error("Error fetching role:", error);
        setRole("Error");
      }
    };

    fetchUserRole();
  }, [user]);

  const menuItems = [
    { label: "Dashboard", icon: "📊" },
    { label: "AI Agent", icon: "💬" },
    { label: "Customers", icon: "👤" },
    { label: "Messages", icon: "💬" },
    { label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="sidebar-container">
      <div className="sidebar-logo-section">
        <div className="logo-icon">🌀</div>
        <h1 className="logo-text">RetainSpot</h1>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, idx) => (
          <div
            key={idx}
            onClick={() => setActiveTab(item.label)}
            className={`nav-item ${activeTab === item.label ? "active" : ""}`}
          >
            <div className="nav-item-content">
              <span>{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-profile">
        <img
          src="https://i.pinimg.com/736x/ef/21/2b/ef212b28cde65a694e040ec0ada257c5.jpg"
          alt="avatar"
        />
        <div className="profile-info">
          <p className="profile-name">
            {user ? user.email.split("@")[0] : "Guest"}
          </p>
          <p className="profile-role">{role}</p>
        </div>
      </div>

      <div className="logout-section">
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
