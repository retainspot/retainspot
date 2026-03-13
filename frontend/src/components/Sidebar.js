import React from "react";

const Sidebar = ({ activeTab, setActiveTab, user, handleLogout }) => {
  const menuItems = [
    { label: "Dashboard", icon: "📊" },
    { label: "Leaderboard", icon: "📈" },
    { label: "Order", icon: "🛒" },
    { label: "Products", icon: "🛍️" },
    { label: "Customers", icon: "👤" },
    { label: "Sales Report", icon: "📉" },
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
          <p className="profile-role">Admin</p>
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
