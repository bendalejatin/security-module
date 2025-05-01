import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Profile from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import './styles/Navbar.css'; // Assuming CSS is in App.css; adjust path if needed

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('guardToken');
    localStorage.removeItem('guardEmail');
    alert('✅ Logged out successfully!');
    navigate('/security/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/guard-portal">Guard Portal</Link>
      </div>
      <div className="navbar-links">
        <Link to="/guard-profile" className="navbar-link"><Profile/><p>Guard Profile</p></Link>
        <button onClick={handleLogout} className="logout-button"><LogoutIcon/> <p>Logout</p></button>
      </div>
    </nav>
  );
};

export default Navbar;