import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles/GuardProfile.css'; // Reuse existing Auth.css with additional styles

//const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://dec-entrykart-backend.onrender.com" ; // deployment url

const GuardProfile = () => {
  const [profile, setProfile] = useState({ email: '', role: '', society: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('guardToken');
  const guardEmail = localStorage.getItem('guardEmail');

  useEffect(() => {
    if (!token || !guardEmail) {
      navigate('/security/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/guard/guard-profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load profile: ' + (err.response?.data?.message || err.message));
        setLoading(false);
        if (err.response?.status === 401) {
          localStorage.removeItem('guardToken');
          localStorage.removeItem('guardEmail');
          navigate('/security/login');
        }
      }
    };

    fetchProfile();
  }, [token, guardEmail, navigate]);

  if (!token || !guardEmail) {
    return (
      <div className="auth-container">
        <h2>Please Log In</h2>
        <p><a href="/security/login">Go to Login</a></p>
      </div>
    );
  }

  if (loading) {
    return <div className="auth-container">Loading profile...</div>;
  }

  if (error) {
    return <div className="auth-container">{error}</div>;
  }

  return (
    <div className="auth-container profile-container">
      <h2>
        <span role="img" aria-label="guard">🛡️</span> Guard Profile
      </h2>
      <div className="profile-details">
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Role:</strong> {profile.role}</p>
        <p>
          <strong>Society:</strong> 
          {profile.society ? profile.society.name : 'Not assigned to any society'}
        </p>
        {profile.society && (
          <p><strong>Society ID:</strong> {profile.society._id}</p>
        )}
      </div>
      <button 
        className="edit-button" 
        onClick={() => alert('Edit functionality coming soon!')}
      >
        Edit Profile
      </button>
      <button 
        className="logout-button" 
        onClick={() => {
          localStorage.removeItem('guardToken');
          localStorage.removeItem('guardEmail');
          navigate('/security/login');
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default GuardProfile;