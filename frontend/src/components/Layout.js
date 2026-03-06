import React from "react";
import Sidebar from "./Sidebar";

const Layout = ({ children, activeTab, setActiveTab, user, handleLogout }) => {
  return (
    <div className="app-layout">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        handleLogout={handleLogout}
      />

      <div className="main-content-wrapper">
        {/* HEADER */}
        <div className="main-header">
          <h1 className="header-title">{activeTab}</h1>
          <div className="header-right">
            <div className="header-search-container">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search here..."
                className="header-search-input"
              />
            </div>
            <div className="header-lang">Eng (US)⌵</div>
            <div className="header-notif">
              🔔<span className="notif-dot"></span>
            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        {children}
      </div>
    </div>
  );
};

export default Layout;
