import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
} from "firebase/auth";
import { useState } from "react";
import { app, auth } from "../FirebaseAuth";
import { divide } from "firebase/firestore/pipelines";

function Registration() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const googleProvider = new GoogleAuthProvider();

  const HandleSignUp = async (e) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("Signup Done");
    } catch (error) {
      console.log(error);
    }
  };

  const HandleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged In");
    } catch (error) {
      console.log(error.code);
    }
  };

  const HandleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      console.log("Done");
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="registration-wrapper">
      <div className="registration-card">
        <div className="registration-logo">
          <span className="logo-icon">🌀</span>
          <h1 className="logo-text">RetainSpot</h1>
        </div>
        <h2 className="registration-title">Welcome back</h2>
        <p className="registration-subtitle">
          Sign in to your account to continue
        </p>

        <form onSubmit={HandleLogin}>
          <input
            className="registration-input"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
          />
          <input
            className="registration-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <button type="submit" className="registration-btn-primary">
            Log In
          </button>
        </form>

        <div className="registration-divider">or</div>

        <button
          className="registration-btn-secondary"
          onClick={HandleGoogleLogin}
        >
          <span>🔵</span> Continue with Google
        </button>

        <div className="registration-footer">
          Don't have an account? <span onClick={HandleSignUp}>Sign Up</span>
        </div>
      </div>
    </div>
  );
}

export default Registration;
