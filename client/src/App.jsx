/**
 * MAIN APP COMPONENT
 * ==================
 * Root component with routing and RBAC
 * Wraps app in AuthProvider for global state
 * 
 * ROLE-BASED ACCESS CONTROL:
 * ==========================
 * ADMIN - Full access to all features
 * ACCOUNTANT - Finance-focused access with read-only for students
 */

import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import { ROLES } from './utils/constants';
import RoleRoute from './routes/RoleRoute';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Classes from './pages/Classes';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Alumni from './pages/Alumni';
import Result from './pages/Result';
import Employees from './pages/Employees';
import FormerEmployees from './pages/FormerEmployees';
import Fees from './pages/Fees';
import Salaries from './pages/Salaries';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Loader from './components/Loader';

// Protected Route Component with Layout
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const { sidebarVisible } = useSidebar();
  
  if (loading) return <Loader />;
  
  if (!user) return <Navigate to="/login" replace />;
  
  // Check role permission
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen bg-gray-100" style={{ position: 'relative', minHeight: '100vh' }}>
        {sidebarVisible && <Sidebar />}
        <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
          <Navbar />
          <main className="flex-1 p-6 overflow-auto" style={{ marginTop: '42px', paddingBottom: '50px' }}>
            <div className="glass rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
              <p className="text-gray-600">You don't have permission to access this page.</p>
              <p className="text-sm text-gray-500 mt-2">Your role: <strong>{user.role}</strong></p>
              <Link to="/dashboard" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Go to Dashboard
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-100" style={{ position: 'relative', minHeight: '100vh' }}>
      {sidebarVisible && <Sidebar />}
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto" style={{ marginTop: '42px', paddingBottom: '50px' }}>
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

// Public Route (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <Loader />;
  
  if (user) return <Navigate to="/dashboard" replace />;
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />

      {/* Protected Routes - Role-Based Access Control */}
      
      {/* Profile - All roles can access */}
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
          <Profile />
        </ProtectedRoute>
      } />
      
      {/* Settings - ADMIN and SUPER_ADMIN */}
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
          <Settings />
        </ProtectedRoute>
      } />
      
      {/* Users - SUPER_ADMIN and ADMIN */}
      <Route path="/users" element={
        <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
          <Users />
        </ProtectedRoute>
      } />
      
      {/* Classes - SUPER_ADMIN and ADMIN (Students is subpage) */}
      <Route path="/classes" element={
        <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
          <Classes />
        </ProtectedRoute>
      } />
      
      {/* Dashboard - All roles can access */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      {/* Students - All can access (Super Admin & Admin: CRUD, Accountant: Read-Only) */}
      <Route path="/students" element={
        <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
          <Students />
        </ProtectedRoute>
      } />
      
      {/* Result - Subpage of Students */}
      <Route path="/students/result" element={
        <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
          <Result />
        </ProtectedRoute>
      } />
      
      {/* Alumni - Subpage of Students */}
      <Route path="/students/alumni" element={
        <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
          <Alumni />
        </ProtectedRoute>
      } />
      
      {/* Employees - SUPER_ADMIN and ADMIN ONLY (full CRUD) */}
      <Route path="/employees" element={
        <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
          <Employees />
        </ProtectedRoute>
      } />
      
      {/* Former Employees - Subpage of Employees */}
      <Route path="/employees/former" element={
        <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
          <FormerEmployees />
        </ProtectedRoute>
      } />
      
      {/* Fees - All can access (SUPER_ADMIN & ADMIN & ACCOUNTANT have CRUD) */}
      <Route path="/fees" element={
        <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
          <Fees />
        </ProtectedRoute>
      } />
      
      {/* Salaries - All can access (manage expense records) */}
      <Route path="/salaries" element={
        <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
          <Salaries />
        </ProtectedRoute>
      } />
      
      {/* Expenses - All can access (track all expenses including salaries and bills) */}
      <Route path="/expenses" element={
        <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
          <Expenses />
        </ProtectedRoute>
      } />
      
      {/* Reports - All can access (SUPER_ADMIN & ADMIN: all, Accountant: financial only) */}
      <Route path="/reports" element={
        <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
          <Reports />
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SidebarProvider>
          <AppRoutes />
        </SidebarProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

