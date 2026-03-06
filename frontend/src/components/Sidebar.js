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
          src="https://scontent.fyyz1-1.fna.fbcdn.net/v/t39.30808-6/487108477_3980465852230905_2761675982364958433_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=a5f93a&_nc_ohc=cel9fmFLh9kQ7kNvwFYGdaB&_nc_oc=AdnOBguIRKMLCjJI4VXMm3u2HQISvJsLUA3vVSGP2he6JH6txV_mhCEwv9zAWu8vmqHWpnyb0XXYgS9j4kga8EbT&_nc_zt=23&_nc_ht=scontent.fyyz1-1.fna&_nc_gid=kQt5ROmR7Wnfk1tET4EJqA&oh=00_AfvVLyKevICxLx12_DTfThhUR4NucQS_8AlHhUqO1gvKsA&oe=698F0CC2"
          alt="avatar"
        />
        <div className="profile-info">
          <p className="profile-name">
            {user ? user.email.split("@")[0] : "Guest"}
          </p>
          <p className="profile-role">Admin</p>
        </div>
        <span className="profile-arrow">⌵</span>
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
