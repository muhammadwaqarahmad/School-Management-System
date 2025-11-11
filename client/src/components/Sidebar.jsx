/**
 * SIDEBAR COMPONENT
 * =================
 * Left navigation sidebar with menu items
 * - Different items based on user role
 * - Highlights active route
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State to track expanded menu items
  const [expandedItems, setExpandedItems] = useState({});

  const menuItems = [
    { path: '/profile', label: 'Profile', icon: 'fa-user', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT], section: 'top' },
    { path: '/dashboard', label: 'Dashboard', icon: '', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT], section: 'main' },
    { path: '/users', label: 'Users', icon: '', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN], section: 'main' },
    { path: '/classes', label: 'Classes', icon: '', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT], section: 'main' },
    { path: '/students', label: 'Students', icon: '', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT], section: 'main', subpages: [{ path: '/students/result', label: 'Result' }, { path: '/students/alumni', label: 'Alumni' }] },
    { path: '/employees', label: 'Employees', icon: '', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN], section: 'main', subpage: { path: '/employees/former', label: 'Former Employees' } },
    { path: '/fees', label: 'Fees', icon: '', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT], section: 'main' },
    { path: '/salaries', label: 'Salaries', icon: '', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT], section: 'main' },
    { path: '/expenses', label: 'Expenses', icon: '', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT], section: 'main' },
    { path: '/reports', label: 'Reports', icon: '', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT], section: 'main' },
    { path: '/settings', label: 'Settings', icon: '', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN], section: 'bottom' },
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  // Separate items by section
  const topItems = filteredMenuItems.filter(item => item.section === 'top');
  const mainItems = filteredMenuItems.filter(item => item.section === 'main');
  const bottomItems = filteredMenuItems.filter(item => item.section === 'bottom');

  // Debug: Log menu items (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('User role:', user?.role);
    console.log('Top items:', topItems.map(i => i.label));
  }

  return (
    <aside 
      className="min-h-screen transition-all duration-300 ease-in-out" 
      style={{ 
        backgroundColor: '#595959', 
        width: '250px', 
        marginTop: '42px', 
        height: 'calc(100vh - 42px)', 
        borderRight: '1px solid #7a8c74',
        padding: 0,
        boxSizing: 'border-box',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: '13px',
        lineHeight: '1.6'
      }}
    >
      <div style={{ overflowY: 'auto', height: '100%', padding: 0 }}>
        <div className="list-group" style={{ margin: 0, padding: 0 }}>
          {/* Profile Section (Top) */}
          {topItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="list-group-item"
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 20px',
                  color: '#ffffff',
                  textDecoration: 'none',
                  backgroundColor: isActive ? '#4a4a4a' : 'transparent',
                  borderBottom: '1px solid #7a8c74',
                  borderLeft: 0,
                  borderRight: 0,
                  borderTop: 0,
                  fontSize: '13px',
                  fontWeight: isActive ? '600' : 'normal',
                  transition: 'background-color 0.2s',
                  margin: 0,
                  borderRadius: 0
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#4a4a4a';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {item.icon && <i className={`fas ${item.icon}`} style={{ marginRight: '8px', width: '16px', textAlign: 'center' }}></i>}
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Main Section */}
          {mainItems.map((item, index) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            // Support both subpage (single) and subpages (array) for backward compatibility
            const hasSubpage = item.subpage !== undefined;
            const hasSubpages = item.subpages !== undefined && Array.isArray(item.subpages);
            const hasAnySubpage = hasSubpage || hasSubpages;
            const subpagesList = hasSubpages ? item.subpages : (hasSubpage ? [item.subpage] : []);
            const isExpanded = expandedItems[item.path] || false;
            
            const toggleExpand = (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (hasAnySubpage) {
                setExpandedItems(prev => ({
                  ...prev,
                  [item.path]: !prev[item.path]
                }));
              }
            };
            
            const handleChevronClick = (e) => {
              e.stopPropagation();
              toggleExpand(e);
            };
            
            const handleLabelClick = (e) => {
              if (hasAnySubpage) {
                e.preventDefault();
                navigate(item.path);
                // Don't auto-expand - user must click chevron to expand
              }
            };
            
            // Check if any subpage is active
            const isSubpageActive = subpagesList.some(subpage => location.pathname === subpage.path);
            const isParentActive = location.pathname === item.path;
            const isItemActive = isParentActive || isSubpageActive;
            
            return (
              <div key={item.path}>
                {/* Parent Item */}
                <div
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    color: '#ffffff',
                    backgroundColor: isExpanded || isItemActive ? '#4a4a4a' : 'transparent',
                    borderBottom: '1px solid #7a8c74',
                    fontSize: '13px',
                    fontWeight: isItemActive ? '600' : 'normal',
                    transition: 'background-color 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#4a4a4a';
                  }}
                  onMouseLeave={(e) => {
                    if (!isExpanded && !isItemActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    } else {
                      e.currentTarget.style.backgroundColor = '#4a4a4a';
                    }
                  }}
                >
                  {!hasAnySubpage ? (
                    <Link
                      to={item.path}
                      style={{ 
                        flex: 1,
                        color: '#ffffff',
                        textDecoration: 'none'
                      }}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <>
                      <Link
                        to={item.path}
                        onClick={handleLabelClick}
                        style={{ 
                          flex: 1,
                          color: '#ffffff',
                          textDecoration: 'none'
                        }}
                      >
                        {item.label}
                      </Link>
                      <div
                        onClick={handleChevronClick}
                        style={{
                          cursor: 'pointer',
                          padding: '4px',
                          marginLeft: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i 
                          className={`fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`}
                          style={{
                            fontSize: '10px',
                            color: '#ffffff',
                            opacity: 0.7,
                            transition: 'transform 0.2s'
                          }}
                        ></i>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Sub-items (shown when expanded) */}
                {hasAnySubpage && isExpanded && subpagesList.map((subpage) => {
                  const isSubpageActiveItem = location.pathname === subpage.path;
                  return (
                    <Link
                      key={subpage.path}
                      to={subpage.path}
                      style={{
                        display: 'block',
                        padding: '12px 20px 12px 40px',
                        color: '#ffffff',
                        textDecoration: 'none',
                        backgroundColor: isSubpageActiveItem ? '#5a5a5a' : '#4a4a4a',
                        borderBottom: '1px solid #7a8c74',
                        fontSize: '13px',
                        fontWeight: isSubpageActiveItem ? '600' : 'normal',
                        transition: 'background-color 0.2s',
                        margin: 0,
                        borderRadius: 0
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubpageActiveItem) {
                          e.currentTarget.style.backgroundColor = '#5a5a5a';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubpageActiveItem) {
                          e.currentTarget.style.backgroundColor = '#4a4a4a';
                        }
                      }}
                    >
                      {subpage.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}

          {/* Settings Section (Bottom) */}
          {bottomItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="list-group-item"
                style={{ 
                  display: 'block',
                  padding: '12px 20px',
                  color: '#ffffff',
                  textDecoration: 'none',
                  backgroundColor: isActive ? '#4a4a4a' : 'transparent',
                  borderBottom: '1px solid #7a8c74',
                  borderLeft: 0,
                  borderRight: 0,
                  borderTop: 0,
                  fontSize: '13px',
                  fontWeight: isActive ? '600' : 'normal',
                  transition: 'background-color 0.2s',
                  margin: 0,
                  borderRadius: 0
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#4a4a4a';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

