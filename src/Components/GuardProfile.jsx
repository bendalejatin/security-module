import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles/GuardProfile.css'; // Reuse existing Auth.css with additional styles

// const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://entrykart-admin.onrender.com"; // deployment url

const GuardProfile = () => {
  const [profile, setProfile] = useState({
    email: '',
    role: '',
    society: null, // Can be an object (e.g., { _id, name }) or ID
    createdAt: '',
    updatedAt: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('guardToken');

  useEffect(() => {
    if (!token) {
      navigate('/security/login');
      return;
    }
  
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/guard-profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(response.data);
        setLoading(false);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Profile not found. Please log in again or contact support.');
        } else if (err.response?.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('guardToken');
          localStorage.removeItem('guardEmail');
          navigate('/security/login');
        } else {
          setError('Failed to load profile: ' + (err.response?.data?.message || err.message));
        }
        setLoading(false);
      }
    };
  
    fetchProfile();
  }, [token, navigate]);

  if (!token) {
    return (
      <div className="auth-container">
        <h2>Please Log In</h2>
        <p>
          <a href="/security/login">Go to Login</a>
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="auth-container">Loading profile...</div>;
  }

  if (error) {
    return <div className="auth-container">{error}</div>;
  }

  // Format dates for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Handle society display (object or ID)
  const societyDisplay = profile.society
    ? typeof profile.society === 'object'
      ? profile.society.name || profile.society._id
      : profile.society
    : 'N/A';

  return (
    <div className="auth-container profile-container">
      <h2>
        <span role="img" aria-label="guard">🛡️</span> Guard Profile
      </h2>
      <div className="profile-details">
        <p>
          <strong>Email:</strong> {profile.email}
        </p>
        <p>
          <strong>Role:</strong> {profile.role}
        </p>
        <p>
          <strong>Society:</strong> {societyDisplay}
        </p>
        <p>
          <strong>Created At:</strong> {profile.createdAt ? formatDate(profile.createdAt) : 'N/A'}
        </p>
        <p>
          <strong>Updated At:</strong> {profile.updatedAt ? formatDate(profile.updatedAt) : 'N/A'}
        </p>
      </div>
      <button
        className="edit-button"
        onClick={() => alert('Edit functionality coming soon!')}
      >
        Edit Profile
      </button>
    </div>
  );
};

export default GuardProfile;
