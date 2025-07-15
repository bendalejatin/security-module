import React, { useState } from "react";
import axios from "axios";
import "./styles/SecurityGuardLogin.css";
// import { Navigate } from "react-router-dom";

//const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://entrykart-admin.onrender.com" ; // deployment url

const SecurityGuardLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${BASE_URL}/api/guard/guard-login`, {
        email,
        password,
      });
      localStorage.setItem("guardToken", response.data.token);
      localStorage.setItem("guardEmail", response.data.email);
      localStorage.setItem("securityToken", response.data.token);
      alert("✅ Login successful!");
        window.location.href = "/security/entry-permission"; // Redirect to entry permission page
    } catch (error) {
      alert(
        "❌ Login failed: " + (error.response?.data?.message || error.message)
      );
    }
  };

  return (
    <div className="auth-container">
      <h2>
        <span role="img" aria-label="shield">
          🛡️
        </span>{" "}
        Security Guard Login
      </h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <a href="/security/signup">Sign Up Here</a>
      </p>
      <p>
        <a href="/security/forgot-password" className="forgot-password">
          Forgot Password?
        </a>
      </p>
    </div>
  );
};

export default SecurityGuardLogin;
