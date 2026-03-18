import React from "react";
import "./Publicnav.css";
 
const PublicNav = ({ activePage, setActivePage }) => {
  return (
    <nav className="pub-nav">
      <div className="pub-nav__inner">
        <div className="pub-nav__logo" onClick={() => setActivePage("Home")}>
          <span>🌀</span>
          <span>RetainSpot</span>
        </div>
        <div className="pub-nav__links">
          <span
            className={`pub-nav__link ${activePage === "Home" ? "pub-nav__link--active" : ""}`}
            onClick={() => setActivePage("Home")}
          >
            Home
          </span>
          <span
            className={`pub-nav__link ${activePage === "Support" ? "pub-nav__link--active" : ""}`}
            onClick={() => setActivePage("Support")}
          >
            Customer Support
          </span>
          <span
            className={`pub-nav__link pub-nav__link--cta ${activePage === "Login" ? "pub-nav__link--cta-active" : ""}`}
            onClick={() => setActivePage("Login")}
          >
            Log In
          </span>
        </div>
      </div>
    </nav>
  );
};
 
export default PublicNav;