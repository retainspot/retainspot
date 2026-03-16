import {
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useState } from "react";
import { auth } from "../FirebaseAuth";
import PublicNav from "../components/Publicnav";
import "./Registration.css";

function Registration({ setPublicPage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const HandleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setLoginError("Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="registration-wrapper">
      <PublicNav activePage="Login" setActivePage={setPublicPage} />

      {/* Background effects */}
      <div className="registration-blob registration-blob--1" />
      <div className="registration-blob registration-blob--2" />
      <div className="registration-grid" />

      <div className="registration-card">
        <div className="registration-logo">
          <span className="logo-icon">🌀</span>
          <h1 className="logo-text">RetainSpot</h1>
        </div>

        <h2 className="registration-title">Welcome back</h2>
        <p className="registration-subtitle">Sign in to your account to continue</p>

        {loginError && (
          <div className="registration-error">⚠️ {loginError}</div>
        )}

        <form onSubmit={HandleLogin}>
          <input
            className="registration-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
          />
          <input
            className="registration-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <button type="submit" className="registration-btn-primary">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}

export default Registration;