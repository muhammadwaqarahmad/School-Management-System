/**
 * LOGIN PAGE - Exact Bahria University CMS Replica
 * ================================================
 * Matching the exact design from Bahria University portal
 * 
 * BACKEND CONNECTION:
 * - Calls POST /api/auth/login via authService
 * - Receives JWT token and user data
 * - Stores token in localStorage
 * - Redirects to dashboard on success
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { schoolName, copyrightYear, poweredBy } from '../utils/config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('SUPER_ADMIN');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // SECURITY CHECK: Selected role must match user's actual role
        const userRole = result.data.user.role;
        
        if (userRole !== role) {
          // Log out immediately if roles don't match
          localStorage.removeItem('token');
          setError(`Access denied. You selected "${role}" but this account is registered as "${userRole}". Please select the correct role.`);
          setLoading(false);
          return;
        }
        
        // Roles match - proceed to dashboard
        navigate('/dashboard');
      } else {
        setError(result.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Fixed Header - School Management */}
      <header style={{
        backgroundColor: '#7a8c74',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1030,
        height: '42px',
        minHeight: '42px',
        borderWidth: 0,
        margin: 0
      }}>
        <div style={{
          width: '100%',
          padding: '0 15px',
          display: 'flex',
          alignItems: 'center',
          height: '100%'
        }}>
          <a href="#" style={{
            color: 'white',
            fontSize: '20px',
            fontWeight: 700,
            textDecoration: 'none'
          }}>
            {schoolName}
          </a>
        </div>
      </header>

      {/* Main Content Wrapper */}
      <div className="bahria-content-wrapper">
        {/* Page Title */}
        <div className="bahria-page-title">
          {role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'ADMIN' ? 'Admin' : 'Accountant'}
        </div>

        {/* Login Form Container */}
        <div className="bahria-form-container">
          
          {/* Error Alert */}
          {error && (
            <div className="bahria-alert-error">
              <div className="bahria-alert-error-content">
                <svg className="bahria-alert-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="bahria-form-group">
              <label htmlFor="email" className="bahria-label">
                Email:
              </label>
              <div className="bahria-input-group">
                <span className="bahria-input-addon">
                  <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                </span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bahria-input"
                  placeholder="EMAIL"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="bahria-form-group">
              <label htmlFor="password" className="bahria-label">
                Password:
              </label>
              <div className="bahria-input-group">
                <span className="bahria-input-addon">
                  <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bahria-input"
                  placeholder="Password"
                  required
                />
              </div>
            </div>

            {/* Role Field */}
            <div className="bahria-form-group">
              <label htmlFor="role" className="bahria-label">
                Role:
              </label>
              <div className="bahria-input-group">
                <span className="bahria-input-addon">
                  <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </span>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="bahria-select"
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="ACCOUNTANT">Accountant</option>
                </select>
              </div>
            </div>

            {/* Sign In Button */}
            <div className="bahria-form-group">
              <button
                type="submit"
                disabled={loading}
                className="bahria-btn-primary"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>

            {/* Footer Link */}
            <div style={{ textAlign: 'right', marginTop: '1rem' }}>
              <a 
                href="#" 
                className="bahria-link"
              >
                Forgot Password?
              </a>
            </div>
          </form>

          {/* Demo Credentials Info Box */}
          <div className="bahria-demo-box">
            <p style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
              Demo Login Credentials:
            </p>
            <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
              <strong>Super Admin:</strong> superadmin@school.com / super123
            </p>
            <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
              <strong>Admin:</strong> admin@school.com / admin123
            </p>
            <p style={{ color: '#6b7280' }}>
              <strong>Accountant:</strong> accountant@school.com / accountant123
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f3f4f6',
        padding: '12px 0',
        fontSize: '14px',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{
          padding: '0 15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start'
        }}>
          <span style={{ color: '#374151', fontWeight: 'normal' }}>
            {copyrightYear || new Date().getFullYear()} © <a href="#" style={{ color: '#337ab7', textDecoration: 'none', fontWeight: 'normal' }}>{schoolName}</a> & Powered by <a href={poweredBy.url} target="_blank" rel="noopener noreferrer" style={{ color: '#337ab7', textDecoration: 'none', fontWeight: 'normal' }}>{poweredBy.name}</a>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Login;
