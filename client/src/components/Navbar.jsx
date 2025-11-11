/**
 * NAVBAR COMPONENT
 * ================
 * Top navigation bar matching Bahria University style:
 * - Hamburger menu for sidebar toggle
 * - School Management title
 * - User dropdown with avatar
 * - Profile and Sign Out options
 * 
 * BACKEND CONNECTION:
 * - Gets user data from AuthContext
 * - Logout calls authService.logout()
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { useNavigate } from 'react-router-dom';
import { schoolName } from '../utils/config';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { sidebarVisible, toggleSidebar } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [showDropdown, setShowDropdown] = React.useState(false);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.user-dropdown-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  return (
    <header 
      className="navbar navbar-fixed-top noselect"
      style={{
        backgroundColor: '#7a8c74',
        height: '42px',
        minHeight: '42px',
        margin: 0,
        borderWidth: 0,
        borderStyle: 'none',
        borderRadius: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1030,
        color: '#fff',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: '13px',
        lineHeight: '1.6',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        cursor: 'default',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ paddingLeft: '15px', paddingRight: '15px', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
          {/* Left Section: Toggle Button + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Sidebar Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="navbar-brand"
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '8px',
                fontSize: '20px',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none'
              }}
              title="Show/Hide Menu"
            >
              <span style={{ fontSize: '18px' }}>☰</span>
            </button>

            {/* Brand Title */}
            <a 
              href="#" 
              className="navbar-brand"
              style={{
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: 700,
                textDecoration: 'none',
                padding: '15px 15px 15px 0',
                lineHeight: '20px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {schoolName}
            </a>
          </div>
          
          {/* Right Section: User Info Dropdown */}
          <div className="user-dropdown-container" style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 15px',
                textDecoration: 'none'
              }}
            >
              {/* User Avatar */}
              <div 
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#ffffff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#68755b',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              
              {/* Username */}
              <span style={{ fontSize: '14px', fontWeight: 500 }}>
                {user?.registrationNo || user?.email}
              </span>
              
              {/* Caret */}
              <span style={{ fontSize: '10px' }}>▼</span>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  minWidth: '200px',
                  boxShadow: '0 6px 12px rgba(0,0,0,0.175)',
                  zIndex: 1000,
                  marginTop: '2px'
                }}
              >
                {/* User Info in Dropdown */}
                <div style={{ padding: '15px', borderBottom: '1px solid #e5e5e5', textAlign: 'center' }}>
                  <div 
                    style={{
                      width: '75px',
                      height: '75px',
                      backgroundColor: '#ffffff',
                      border: '3px solid #68755b',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#68755b',
                      fontWeight: 'bold',
                      fontSize: '32px',
                      margin: '0 auto 10px'
                    }}
                  >
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '5px' }}>
                    {user?.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#777' }}>
                    {user?.email}
                  </div>
                </div>

                {/* Dropdown Items */}
                <a
                  href="/profile"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/profile');
                    setShowDropdown(false);
                  }}
                  style={{
                    display: 'block',
                    padding: '10px 20px',
                    color: '#333',
                    textDecoration: 'none',
                    fontSize: '14px',
                    borderBottom: '1px solid #e5e5e5'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Profile
                </a>

                <button
                  onClick={() => {
                    handleLogout();
                    setShowDropdown(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 20px',
                    color: '#333',
                    textDecoration: 'none',
                    fontSize: '14px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <i className="fas fa-sign-out-alt"></i> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

