import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/SecurityGuardSignup.css";

//const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://dec-entrykart-backend.onrender.com" ; // deployment url

const SecurityGuardSignup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert("❌ Passwords do not match!");
      return;
    }

    try {
      await axios.post(`${BASE_URL}/api/guard/guard-register`, {
        email,
        password,
        society: selectedSociety,
      });
      alert("✅ Registration successful! Please log in.");
      window.location.href = "/security/login"; // Redirect to login page
    } catch (error) {
      alert(
        "❌ Registration failed: " + (error.response?.data?.message || error.message)
      );
    }
  };

  const [societies, setSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState("");

  const fetchSocieties = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/societies?email=dec@gmail.com`
      );
      setSocieties(response.data);
    } catch (error) {
      console.error("Error fetching societies:", error);
    }
  };

  useEffect(() => {
    fetchSocieties();
  }, []);

  return (
    <div className="auth-container">
      <h2>
        <span role="img" aria-label="shield">
          🛡️
        </span>{" "}
        Security Guard Signup
      </h2>

      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <h3>Society:</h3>
          <select
            value={selectedSociety}
            onChange={(e) => setSelectedSociety(e.target.value)}
            required
            className="input-field"
          >
            <option value="">Select Society</option>
            {societies.map((society) => (
              <option key={society._id} value={society._id}>
                {society.name}
              </option>
            ))}
          </select>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">Sign Up</button>
      </form>
      <p>
        Already have an account? <a href="/security/login">Login Here</a>
      </p>
    </div>
  );
};

export default SecurityGuardSignup;