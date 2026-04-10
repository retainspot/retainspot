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
          
          <div className="header-right">
            <div className="header-search-container">
              
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
