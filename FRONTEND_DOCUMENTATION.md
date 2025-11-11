# 🎯 **Complete Frontend Integration Documentation**

## 📖 **Table of Contents**
1. [Architecture Overview](#architecture-overview)
2. [How Backend & Frontend Connect](#how-backend--frontend-connect)
3. [File Structure Explained](#file-structure-explained)
4. [API Integration Flow](#api-integration-flow)
5. [Complete Page Examples](#complete-page-examples)
6. [Running the Application](#running-the-application)

---

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────┐
│                     REACT FRONTEND                       │
│  (http://localhost:3000)                                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Pages (UI) ──► Services ──► Axios ──► HTTP Requests    │
│       │                                        │          │
│       │                                        ▼          │
│       └──► Components ◄───┐                             │
│               │             │                             │
│               ▼             │                             │
│          AuthContext       │                             │
│                             │                             │
└─────────────────────────────┼─────────────────────────────┘
                               │
                               │ JWT Token in Headers
                               │
┌──────────────────────────────▼──────────────────────────┐
│                  EXPRESS BACKEND                         │
│  (http://localhost:5000/api)                            │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Routes ──► Middleware ──► Controllers ──► Prisma ──► DB │
│              (auth check)                   (ORM)        │
│                                                           │
└─────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────┐
│                  POSTGRESQL DATABASE                     │
│  (localhost:5432/school_management)                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🔗 **How Backend & Frontend Connect**

### **Step-by-Step Connection Flow:**

### **1. User Logs In**
```
User enters credentials
    │
    ▼
Login.jsx (Frontend)
    │
    ▼
authService.login(email, password)
    │
    ▼
Axios POST to /api/auth/login
    │
    ▼
Backend authController.login
    │
    ▼
Prisma queries database
    │
    ▼
Returns JWT token + user data
    │
    ▼
Frontend stores in localStorage
    │
    ▼
Redirect to Dashboard
```

### **2. Fetching Data (Example: Students)**
```
Students.jsx loads
    │
    ▼
useEffect calls studentService.getAll()
    │
    ▼
Axios GET /api/students
    │
    ▼
API Interceptor adds JWT token to headers
    │
    ▼
Backend authMiddleware verifies token
    │
    ▼
Backend studentController.getStudents
    │
    ▼
Prisma fetches from database
    │
    ▼
Returns JSON response
    │
    ▼
Frontend displays in DataTable component
```

---

## 📁 **File Structure Explained**

### **SERVICE LAYER** (`src/services/`)

#### **api.js** - Base Axios Configuration
```javascript
// WHY: Single source of truth for API calls
// WHAT IT DOES:
//   1. Sets base URL (http://localhost:5000/api)
//   2. Adds token to ALL requests automatically
//   3. Handles 401 errors (redirects to login)
//   4. Extracts data from responses

import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Automatically add token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
API.interceptors.response.use(
  (response) => response.data, // Extract data
  (error) => {
    if (error.response?.status === 401) {
      // Token expired - logout user
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data);
  }
);
```

#### **authService.js** - Authentication API Calls
```javascript
// BACKEND ENDPOINTS IT CALLS:
//   POST /api/auth/login
//   POST /api/auth/register
//   GET  /api/auth/profile

import API from './api';

const authService = {
  login: async (email, password) => {
    // Calls: POST /api/auth/login
    const response = await API.post('/auth/login', { email, password });
    
    // Backend returns: { success: true, data: { token, user } }
    if (response.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
```

### **CONTEXT** (`src/context/`)

#### **AuthContext.jsx** - Global Authentication State
```javascript
// WHY: Share user data across entire app without prop drilling
// PROVIDES:
//   - user: Current logged-in user
//   - login(): Function to log in
//   - logout(): Function to log out
//   - isAuthenticated: Boolean

import { createContext, useState, useContext } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    setUser(response.data.user); // Update global state
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null); // Clear global state
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth anywhere
export const useAuth = () => useContext(AuthContext);
```

---

## 🎨 **Complete Page Examples**

### **Dashboard.jsx** - Financial Overview
```javascript
/**
 * DASHBOARD PAGE
 * ==============
 * Shows financial overview with stats
 * 
 * BACKEND ENDPOINT: GET /api/reports/overview
 * RETURNS: {
 *   students: { total: 150 },
 *   employees: { total: 20 },
 *   fees: { total: 750000, paid: 500000, unpaid: 250000 },
 *   salaries: { total: 1000000, paid: 800000, unpaid: 200000 },
 *   netProfit: -300000
 * }
 */

import { useState, useEffect } from 'react';
import reportService from '../services/reportService';
import { formatCurrency } from '../utils/currencyFormatter';
import Loader from '../components/Loader';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await reportService.getFinancialOverview();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">Total Students</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.students.total}</p>
        </div>

        {/* Total Employees Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">Total Employees</h3>
          <p className="text-3xl font-bold text-green-600">{stats.employees.total}</p>
        </div>

        {/* Fee Collection Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">Fee Collection</h3>
          <p className="text-3xl font-bold text-purple-600">
            {formatCurrency(stats.fees.paid.amount)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Unpaid: {formatCurrency(stats.fees.unpaid.amount)}
          </p>
        </div>

        {/* Salary Payments Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">Salary Payments</h3>
          <p className="text-3xl font-bold text-orange-600">
            {formatCurrency(stats.salaries.paid.amount)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Pending: {formatCurrency(stats.salaries.unpaid.amount)}
          </p>
        </div>
      </div>

      {/* Net Profit/Loss */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Financial Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-gray-600">Total Income</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.fees.paid.amount)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.salaries.paid.amount)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Net Profit/Loss</p>
            <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.netProfit)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```

### **Students.jsx** - Complete CRUD Operations
```javascript
/**
 * STUDENTS PAGE
 * =============
 * Full CRUD operations for students
 * 
 * BACKEND ENDPOINTS:
 *   GET    /api/students          - List all students
 *   POST   /api/students          - Create new student
 *   PUT    /api/students/:id      - Update student
 *   DELETE /api/students/:id      - Delete student
 */

import { useState, useEffect } from 'react';
import studentService from '../services/studentService';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    class: '',
    section: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  // Fetch all students from backend
  const fetchStudents = async () => {
    try {
      const response = await studentService.getAll();
      setStudents(response.data.students);
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  // Create or update student
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        // UPDATE: PUT /api/students/:id
        await studentService.update(editingId, formData);
        alert('Student updated successfully');
      } else {
        // CREATE: POST /api/students
        await studentService.create(formData);
        alert('Student created successfully');
      }
      
      // Refresh list and close modal
      fetchStudents();
      handleCloseModal();
    } catch (error) {
      alert(error.message || 'Operation failed');
    }
  };

  // Delete student
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    try {
      // DELETE: DELETE /api/students/:id
      await studentService.delete(id);
      alert('Student deleted successfully');
      fetchStudents();
    } catch (error) {
      alert(error.message || 'Failed to delete student');
    }
  };

  // Open modal for editing
  const handleEdit = (student) => {
    setFormData({
      name: student.name,
      rollNo: student.rollNo,
      class: student.class,
      section: student.section || ''
    });
    setEditingId(student.id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', rollNo: '', class: '', section: '' });
  };

  // Define table columns
  const columns = [
    { label: 'ID', key: 'id' },
    { label: 'Name', key: 'name' },
    { label: 'Roll No', key: 'rollNo' },
    { label: 'Class', key: 'class' },
    { label: 'Section', key: 'section' },
    { label: 'Created', key: 'createdAt', type: 'date' },
  ];

  // Define action buttons
  const actions = (student) => (
    <>
      <button
        onClick={() => handleEdit(student)}
        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
      >
        Edit
      </button>
      <button
        onClick={() => handleDelete(student.id)}
        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
      >
        Delete
      </button>
    </>
  );

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Students</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
        >
          Add New Student
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={students}
        actions={actions}
        emptyMessage="No students found. Add your first student!"
      />

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingId ? 'Edit Student' : 'Add New Student'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Roll No</label>
                <input
                  type="text"
                  value={formData.rollNo}
                  onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Class</label>
                <input
                  type="text"
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Section</label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
```

---

## 🚀 **Running the Application**

### **Step 1: Start Backend Server**
```bash
cd server
npm run dev
```
Backend runs on: **http://localhost:5000**

### **Step 2: Start Frontend**
```bash
cd client
npm install  # If first time
npm run dev
```
Frontend runs on: **http://localhost:3000** (or check terminal output)

### **Step 3: Login**
Visit: http://localhost:3000
- Email: `admin@school.com`
- Password: `admin123`

---

## 🔐 **Authentication Flow Details**

### **How JWT Token Works:**

1. **User logs in** → Frontend sends credentials to backend
2. **Backend verifies** → Returns JWT token
3. **Frontend stores token** in localStorage
4. **Every API request** → Axios interceptor adds token to headers
5. **Backend verifies token** → authMiddleware checks if valid
6. **If token expired** → Backend returns 401, frontend redirects to login

### **Token in Action:**
```javascript
// LOGIN - Get token
POST /api/auth/login
Body: { email, password }
Response: { token: "eyJhbGci...", user: {...} }

// PROTECTED REQUEST - Use token
GET /api/students
Headers: { Authorization: "Bearer eyJhbGci..." }
Response: { success: true, data: { students: [...] } }
```

---

## 📊 **Data Flow Example: Creating a Student**

### **Frontend (Students.jsx):**
```javascript
// 1. User fills form and clicks "Create"
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // 2. Call service
  await studentService.create({
    name: "Ali Ahmed",
    rollNo: "2024001",
    class: "10",
    section: "A"
  });
};
```

### **Service Layer (studentService.js):**
```javascript
// 3. Service makes API call
create: async (data) => {
  return await API.post('/students', data);
}
```

### **API Layer (api.js):**
```javascript
// 4. Axios interceptor adds token
config.headers.Authorization = `Bearer ${token}`;

// 5. Makes HTTP POST request to backend
POST http://localhost:5000/api/students
Headers: {
  Authorization: "Bearer eyJhbGci...",
  Content-Type: "application/json"
}
Body: {
  name: "Ali Ahmed",
  rollNo: "2024001",
  class: "10",
  section: "A"
}
```

### **Backend (studentController.js):**
```javascript
// 6. authMiddleware verifies token
// 7. Controller receives request
export const createStudent = async (req, res) => {
  const { name, rollNo, class: className, section } = req.body;
  
  // 8. Prisma saves to database
  const student = await prisma.student.create({
    data: { name, rollNo, class: className, section }
  });
  
  // 9. Returns response
  res.status(201).json({
    success: true,
    message: "Resource created successfully",
    data: { student }
  });
};
```

### **Frontend Receives Response:**
```javascript
// 10. Success! Refresh student list
fetchStudents();
alert('Student created successfully');
```

---

## 🎯 **Key Takeaways**

### **Frontend → Backend Communication:**
1. **Services** → Clean API abstraction
2. **Axios Interceptors** → Automatic token handling
3. **AuthContext** → Global state management
4. **Components** → Reusable UI elements
5. **Pages** → Feature-specific views

### **Backend → Frontend Response:**
- Always JSON format
- Consistent structure: `{ success, message, data }`
- HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized)

### **Security:**
- JWT tokens for authentication
- Token verification on every protected route
- Auto-logout on token expiration
- Role-based access control

---

**Your backend and frontend are now fully integrated!** 🎉

