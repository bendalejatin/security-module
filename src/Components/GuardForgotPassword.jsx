import React, { useState } from "react";
import axios from "axios";
import "./styles/SecurityGuardLogin.css"; // reuse same styles

const BASE_URL = "http://localhost:5000"; // Adjust to your backend

const GuardForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${BASE_URL}/api/guard/forgot-password`, { email });
      setMessage(response.data.message || "Password reset link sent to your email.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Something went wrong.");
    }
  };

  return (
    <div className="auth-container">
      <h2>🔑 Forgot Password</h2>
      <form onSubmit={handleForgotPassword}>
        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Send Reset Link</button>
      </form>
      {message && <p>{message}</p>}
      <p>
        <a href="/security/login">Back to Login</a>
      </p>
    </div>
  );
};

export default GuardForgotPassword;
