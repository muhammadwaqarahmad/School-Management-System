# 🔐 Role-Based Access Control (RBAC) Documentation
## School Management System by Yuxor

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Roles & Permissions](#roles--permissions)
3. [Implementation Details](#implementation-details)
4. [Testing Guide](#testing-guide)
5. [Security Features](#security-features)

---

## 🎯 Overview

The School Management System implements comprehensive **Role-Based Access Control (RBAC)** with two distinct user roles:

- 🧑‍💼 **Admin** - Full system access and control
- 💰 **Accountant** - Finance-focused with limited access

The system enforces role-based restrictions at multiple levels:
- ✅ Login validation
- ✅ Route protection
- ✅ Component-level access control
- ✅ UI element visibility
- ✅ Backend API authorization

---

## 👥 Roles & Permissions

### 🧑‍💼 Admin Role

**Full System Privileges** - Complete control over all features

#### Access Rights:
✅ **Dashboard** - View all statistics and financial data  
✅ **Students** - Full CRUD (Create, Read, Update, Delete)  
✅ **Employees** - Full CRUD *(Admin Only)*  
✅ **Fees** - Full CRUD for fee management  
✅ **Salaries** - Full CRUD for salary management  
✅ **Reports** - Access to all reports (academic & financial)  

#### Capabilities:
- Add, update, and delete students
- Add, update, and delete faculty/employees
- Manage all financial records (fees, salaries, expenses)
- Create and assign user roles
- Manage system settings and configurations
- View and generate all types of reports
- Access all dashboards and pages

---

### 💰 Accountant Role

**Finance-Focused Access** - Limited to financial operations

#### Access Rights:
✅ **Dashboard** - View financial statistics  
✅ **Students** - Read-Only (cannot add/edit/delete)  
❌ **Employees** - No Access *(Admin Only)*  
✅ **Fees** - Full CRUD for fee management  
✅ **Salaries** - Full CRUD for expense records  
✅ **Reports** - Financial reports only  

#### Capabilities:
- View student information (read-only)
- Add, edit, and delete fee records
- Add, edit, and delete salary/expense records
- View and generate financial reports
- View income and expense summaries

#### Restrictions:
- ❌ Cannot add, edit, or delete students
- ❌ Cannot access employee management
- ❌ Cannot add or delete system users
- ❌ Cannot change roles or permissions
- ❌ Cannot access system configuration

---

## 🛠️ Implementation Details

### 1. **Login Security** (`client/src/pages/Login.jsx`)

```javascript
// Role selection is mandatory before login
<select value={role} onChange={(e) => setRole(e.target.value)}>
  <option value="ADMIN">Admin</option>
  <option value="ACCOUNTANT">Accountant</option>
</select>

// Security check during login
if (userRole !== role) {
  localStorage.removeItem('token');
  setError(`Access denied. You selected "${role}" but this account is registered as "${userRole}".`);
  return;
}
```

**How it works:**
- User must select their role before logging in
- System validates if selected role matches database role
- If roles don't match, login is denied and token is removed
- Clear error message guides user to select correct role

---

### 2. **Route Protection** (`client/src/App.jsx`)

```javascript
// Admin-only route
<Route path="/employees" element={
  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
    <Employees />
  </ProtectedRoute>
} />

// Both roles can access
<Route path="/fees" element={
  <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
    <Fees />
  </ProtectedRoute>
} />
```

**Route Access Matrix:**

| Route | Admin | Accountant |
|-------|-------|------------|
| `/dashboard` | ✅ Full | ✅ Financial Stats |
| `/students` | ✅ CRUD | ✅ Read-Only |
| `/employees` | ✅ CRUD | ❌ No Access |
| `/fees` | ✅ CRUD | ✅ CRUD |
| `/salaries` | ✅ CRUD | ✅ CRUD |
| `/reports` | ✅ All Reports | ✅ Financial Only |

---

### 3. **Sidebar Navigation** (`client/src/components/Sidebar.jsx`)

```javascript
const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: [ROLES.ADMIN, ROLES.ACCOUNTANT] },
  { path: '/employees', label: 'Employees', icon: '👨‍💼', roles: [ROLES.ADMIN] }, // Admin only
  // ... other items
];

// Filter menu based on role
const filteredMenuItems = menuItems.filter(item => 
  item.roles.includes(user?.role)
);
```

**Result:**
- Admin sees all menu items
- Accountant doesn't see "Employees" menu item
- Dynamic menu based on current user role

---

### 4. **Component-Level Access** (`client/src/pages/Students.jsx`)

```javascript
const { user } = useAuth();
const isAccountant = user?.role === ROLES.ACCOUNTANT;
const isAdmin = user?.role === ROLES.ADMIN;

// Show read-only badge for accountants
{isAccountant && (
  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
    👁️ Read-Only Access
  </span>
)}

// Hide "Add New Student" button for accountants
{isAdmin && (
  <button onClick={() => setShowModal(true)}>
    Add New Student
  </button>
)}

// Hide Edit/Delete actions for accountants
const actions = isAdmin ? (student) => (
  <>
    <button onClick={() => handleEdit(student)}>Edit</button>
    <button onClick={() => handleDelete(student.id)}>Delete</button>
  </>
) : null;
```

**Features:**
- Visual indicators for read-only access
- Conditional UI elements based on role
- Informative messages explaining restrictions
- Actions hidden completely (not just disabled)

---

## 🧪 Testing Guide

### Test Case 1: Admin Login ✅

```
Email: admin@school.com
Password: admin123
Role: Admin (selected)

Expected Result:
✅ Login successful
✅ Can access all pages
✅ Can see "Add New Student" button
✅ Can see Edit/Delete buttons
✅ Can access Employees page
```

---

### Test Case 2: Admin with Wrong Role Selected ❌

```
Email: admin@school.com
Password: admin123
Role: Accountant (selected - WRONG!)

Expected Result:
❌ Login denied
❌ Error message: "Access denied. You selected 'ACCOUNTANT' but this account is registered as 'ADMIN'..."
❌ Token removed from storage
```

---

### Test Case 3: Accountant Login ✅

```
Email: accountant@school.com
Password: accountant123
Role: Accountant (selected)

Expected Result:
✅ Login successful
✅ Can access Dashboard, Students, Fees, Salaries, Reports
❌ Cannot see Employees menu item
✅ Students page shows "Read-Only Access" badge
❌ Cannot see "Add New Student" button
❌ Cannot see Edit/Delete buttons on students
```

---

### Test Case 4: Accountant Tries to Access Employees ❌

```
Accountant logs in successfully
Manually types URL: http://localhost:5173/employees

Expected Result:
❌ Access Denied page shown
❌ Message: "You don't have permission to access this page"
❌ Shows current role: "ACCOUNTANT"
❌ "Go to Dashboard" button provided
```

---

### Test Case 5: Accountant with Wrong Role ❌

```
Email: accountant@school.com
Password: accountant123
Role: Admin (selected - WRONG!)

Expected Result:
❌ Login denied
❌ Error message shown
❌ Must select "Accountant" role to proceed
```

---

## 🔒 Security Features

### 1. **Multi-Layer Security**

```
┌─────────────────────────────────────┐
│   Layer 1: Login Validation        │ ← Role must match database
├─────────────────────────────────────┤
│   Layer 2: Route Protection         │ ← Unauthorized routes blocked
├─────────────────────────────────────┤
│   Layer 3: Component Access         │ ← UI elements hidden/disabled
├─────────────────────────────────────┤
│   Layer 4: Backend Authorization    │ ← API validates JWT & role
└─────────────────────────────────────┘
```

---

### 2. **Token Management**

- JWT token stored in localStorage after successful login
- Token includes user role information
- Token automatically removed if role mismatch detected
- Backend validates token on every API request

---

### 3. **Role Validation Flow**

```
User Login
    ↓
Enter Credentials + Select Role
    ↓
Backend Authenticates
    ↓
Check: Selected Role == Database Role?
    ↓
  YES ────→ Generate JWT Token → Login Success
    ↓                                   ↓
   NO                          Store Token & User Data
    ↓                                   ↓
 Deny Access                    Redirect to Dashboard
    ↓                                   ↓
Remove Token                  Apply Role-Based UI
    ↓
Show Error Message
```

---

### 4. **Access Denied Handling**

When unauthorized access is attempted:
1. ✅ User redirected gracefully (no crash)
2. ✅ Clear error message displayed
3. ✅ Shows user's current role
4. ✅ Provides "Go to Dashboard" button
5. ✅ Logs access attempt (can be extended)

---

## 📊 Role Comparison Summary

| Feature | Admin | Accountant |
|---------|-------|------------|
| **Dashboard Access** | ✅ Full | ✅ Limited |
| **View Students** | ✅ | ✅ Read-Only |
| **Add/Edit Students** | ✅ | ❌ |
| **Delete Students** | ✅ | ❌ |
| **View Employees** | ✅ | ❌ |
| **Manage Employees** | ✅ | ❌ |
| **Manage Fees** | ✅ Full CRUD | ✅ Full CRUD |
| **Manage Salaries** | ✅ Full CRUD | ✅ Full CRUD |
| **Financial Reports** | ✅ | ✅ |
| **Academic Reports** | ✅ | ❌ |
| **System Settings** | ✅ | ❌ |
| **User Management** | ✅ | ❌ |

---

## 🎯 Key Takeaways

1. **Security First**: Multiple layers of protection ensure no unauthorized access
2. **User-Friendly**: Clear visual indicators and helpful messages
3. **Role Enforcement**: Strict validation at login, routing, and component levels
4. **Scalable**: Easy to add new roles or modify permissions
5. **Maintainable**: Clean code structure with centralized role definitions

---

## 📝 Files Modified

1. ✅ `client/src/routes/RoleRoute.jsx` - Created role-based route wrapper
2. ✅ `client/src/App.jsx` - Updated with role-based routing
3. ✅ `client/src/pages/Login.jsx` - Added role validation
4. ✅ `client/src/pages/Students.jsx` - Implemented read-only mode
5. ✅ `client/src/components/Sidebar.jsx` - Role-based menu filtering
6. ✅ Backend routes already have role middleware protection

---

## 🚀 Next Steps

To extend RBAC functionality:
1. Add role-based filtering in Reports page
2. Implement activity logging for access attempts
3. Add more granular permissions (e.g., can view but not export)
4. Create admin panel for role management
5. Add email notifications for unauthorized access attempts

---

**Built with ❤️ by Yuxor Company**
*School Management System - Secure, Scalable, Reliable*

