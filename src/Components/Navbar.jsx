import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Profile from '@mui/icons-material/AccountCircle';
import './styles/Navbar.css'; // Assuming CSS is in App.css; adjust path if needed

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/guard-portal">Guard Portal</Link>
      </div>
      <div className="navbar-links">
        <Link to="/guard-profile" className="navbar-link"><Profile/><p>Guard Profile</p></Link>
      </div>
    </nav>
  );
};

export default Navbar;