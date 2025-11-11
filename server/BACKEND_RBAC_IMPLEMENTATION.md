# 🔐 Backend RBAC Implementation Guide
## School Management System - Backend Security

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Route Protection Matrix](#route-protection-matrix)
3. [Middleware Implementation](#middleware-implementation)
4. [API Endpoints by Role](#api-endpoints-by-role)
5. [Testing Guide](#testing-guide)
6. [Error Responses](#error-responses)

---

## 🎯 Overview

The backend implements **Role-Based Access Control (RBAC)** using middleware layers that validate:
1. ✅ User authentication (valid JWT token)
2. ✅ User authorization (correct role for the endpoint)
3. ✅ Data access permissions

**Security Layers:**
```
Request → authMiddleware → roleMiddleware → Controller → Response
   ↓           ↓                ↓              ↓
Verify JWT   Check Role    Business Logic   Return Data
```

---

## 🛡️ Route Protection Matrix

### **Students API** (`/api/students`)

| Method | Endpoint | Admin | Accountant | Description |
|--------|----------|-------|------------|-------------|
| GET | `/` | ✅ | ✅ | View all students |
| GET | `/:id` | ✅ | ✅ | View single student |
| POST | `/` | ✅ | ❌ | Create new student |
| PUT | `/:id` | ✅ | ❌ | Update student |
| DELETE | `/:id` | ✅ | ❌ | Delete student |

**Implementation:**
```javascript
// Both can view
router.get("/", adminOrAccountant, getStudents);
router.get("/:id", adminOrAccountant, getStudent);

// Only Admin can modify
router.post("/", adminOnly, createStudent);
router.put("/:id", adminOnly, updateStudent);
router.delete("/:id", adminOnly, deleteStudent);
```

---

### **Employees API** (`/api/employees`)

| Method | Endpoint | Admin | Accountant | Description |
|--------|----------|-------|------------|-------------|
| GET | `/` | ✅ | ❌ | View all employees |
| GET | `/:id` | ✅ | ❌ | View single employee |
| POST | `/` | ✅ | ❌ | Create new employee |
| PUT | `/:id` | ✅ | ❌ | Update employee |
| DELETE | `/:id` | ✅ | ❌ | Delete employee |

**Implementation:**
```javascript
// ALL operations are Admin ONLY
router.get("/", adminOnly, getEmployees);
router.get("/:id", adminOnly, getEmployee);
router.post("/", adminOnly, createEmployee);
router.put("/:id", adminOnly, updateEmployee);
router.delete("/:id", adminOnly, deleteEmployee);
```

---

### **Fees API** (`/api/fees`)

| Method | Endpoint | Admin | Accountant | Description |
|--------|----------|-------|------------|-------------|
| GET | `/` | ✅ | ✅ | View all fees |
| GET | `/:id` | ✅ | ✅ | View single fee |
| POST | `/` | ✅ | ✅ | Create new fee |
| PUT | `/:id` | ✅ | ✅ | Update fee |
| PATCH | `/:id/pay` | ✅ | ✅ | Mark fee as paid |
| DELETE | `/:id` | ✅ | ✅ | Delete fee |

**Implementation:**
```javascript
// Both Admin and Accountant have full CRUD
router.get("/", adminOrAccountant, getFees);
router.post("/", adminOrAccountant, createFee);
router.put("/:id", adminOrAccountant, updateFee);
router.patch("/:id/pay", adminOrAccountant, markFeeAsPaid);
router.delete("/:id", adminOrAccountant, deleteFee);
```

---

### **Salaries API** (`/api/salaries`)

| Method | Endpoint | Admin | Accountant | Description |
|--------|----------|-------|------------|-------------|
| GET | `/` | ✅ | ✅ | View all salaries |
| GET | `/:id` | ✅ | ✅ | View single salary |
| POST | `/` | ✅ | ✅ | Create new salary |
| PUT | `/:id` | ✅ | ✅ | Update salary |
| PATCH | `/:id/pay` | ✅ | ✅ | Mark salary as paid |
| DELETE | `/:id` | ✅ | ✅ | Delete salary |

**Implementation:**
```javascript
// Both Admin and Accountant have full CRUD
router.get("/", adminOrAccountant, getSalaries);
router.post("/", adminOrAccountant, createSalary);
router.put("/:id", adminOrAccountant, updateSalary);
router.patch("/:id/pay", adminOrAccountant, markSalaryAsPaid);
router.delete("/:id", adminOrAccountant, deleteSalary);
```

---

### **Reports API** (`/api/reports`)

| Method | Endpoint | Admin | Accountant | Description |
|--------|----------|-------|------------|-------------|
| GET | `/overview` | ✅ | ✅ | Financial overview |
| GET | `/fees/month/:month` | ✅ | ✅ | Monthly fee report |
| GET | `/salaries/month/:month` | ✅ | ✅ | Monthly salary report |
| GET | `/student/:id/fees` | ✅ | ✅ | Student fee history |
| GET | `/employee/:id/salaries` | ✅ | ❌ | Employee salary history |
| GET | `/defaulters` | ✅ | ✅ | Fee defaulters list |

**Implementation:**
```javascript
// Financial reports - Both can access
router.get("/overview", adminOrAccountant, getFinancialOverview);
router.get("/fees/month/:month", adminOrAccountant, getMonthlyFeeReport);
router.get("/salaries/month/:month", adminOrAccountant, getMonthlySalaryReport);
router.get("/student/:studentId/fees", adminOrAccountant, getStudentFeeHistory);
router.get("/defaulters", adminOrAccountant, getDefaulters);

// Employee-related - Admin only
router.get("/employee/:employeeId/salaries", adminOnly, getEmployeeSalaryHistory);
```

---

## 🔧 Middleware Implementation

### **1. Authentication Middleware** (`authMiddleware.js`)

Validates JWT token and extracts user information:

```javascript
import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login.'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};
```

---

### **2. Role Middleware** (`roleMiddleware.js`)

Checks if user has required role:

```javascript
import { ROLES, HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';

// Check if user has required role(s)
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN,
        error: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        yourRole: req.user.role
      });
    }
    
    next();
  };
};

// Pre-defined middleware functions
export const adminOnly = requireRole(ROLES.ADMIN);
export const adminOrAccountant = requireRole(ROLES.ADMIN, ROLES.ACCOUNTANT);
```

---

## 📝 API Endpoints by Role

### 🧑‍💼 **Admin Access**

**Full System Access:**
```
✅ GET    /api/students               (View all students)
✅ POST   /api/students               (Create student)
✅ PUT    /api/students/:id           (Update student)
✅ DELETE /api/students/:id           (Delete student)

✅ GET    /api/employees              (View all employees)
✅ POST   /api/employees              (Create employee)
✅ PUT    /api/employees/:id          (Update employee)
✅ DELETE /api/employees/:id          (Delete employee)

✅ GET    /api/fees                   (View all fees)
✅ POST   /api/fees                   (Create fee)
✅ PUT    /api/fees/:id               (Update fee)
✅ PATCH  /api/fees/:id/pay           (Mark as paid)
✅ DELETE /api/fees/:id               (Delete fee)

✅ GET    /api/salaries               (View all salaries)
✅ POST   /api/salaries               (Create salary)
✅ PUT    /api/salaries/:id           (Update salary)
✅ PATCH  /api/salaries/:id/pay       (Mark as paid)
✅ DELETE /api/salaries/:id           (Delete salary)

✅ GET    /api/reports/overview       (Financial overview)
✅ GET    /api/reports/fees/month/:m  (Fee reports)
✅ GET    /api/reports/salaries/month/:m (Salary reports)
✅ GET    /api/reports/employee/:id/salaries (Employee history)
```

---

### 💰 **Accountant Access**

**Finance-Focused Access:**
```
✅ GET    /api/students               (View students - READ ONLY)
✅ GET    /api/students/:id           (View student - READ ONLY)
❌ POST   /api/students               (DENIED)
❌ PUT    /api/students/:id           (DENIED)
❌ DELETE /api/students/:id           (DENIED)

❌ ALL    /api/employees/*            (DENIED - No employee access)

✅ GET    /api/fees                   (View all fees)
✅ POST   /api/fees                   (Create fee)
✅ PUT    /api/fees/:id               (Update fee)
✅ PATCH  /api/fees/:id/pay           (Mark as paid)
✅ DELETE /api/fees/:id               (Delete fee)

✅ GET    /api/salaries               (View all salaries)
✅ POST   /api/salaries               (Create salary)
✅ PUT    /api/salaries/:id           (Update salary)
✅ PATCH  /api/salaries/:id/pay       (Mark as paid)
✅ DELETE /api/salaries/:id           (Delete salary)

✅ GET    /api/reports/overview       (Financial overview)
✅ GET    /api/reports/fees/month/:m  (Fee reports)
✅ GET    /api/reports/salaries/month/:m (Salary reports)
❌ GET    /api/reports/employee/:id/salaries (DENIED)
```

---

## 🧪 Testing Guide

### **Test 1: Admin Creates Student** ✅

```bash
# Login as Admin
POST http://localhost:5000/api/auth/login
{
  "email": "admin@school.com",
  "password": "admin123"
}

# Create Student (Should succeed)
POST http://localhost:5000/api/students
Authorization: Bearer <admin_token>
{
  "name": "John Doe",
  "rollNo": "2024001",
  "class": "10",
  "section": "A"
}

Expected Response: 201 Created
```

---

### **Test 2: Accountant Tries to Create Student** ❌

```bash
# Login as Accountant
POST http://localhost:5000/api/auth/login
{
  "email": "accountant@school.com",
  "password": "accountant123"
}

# Try to Create Student (Should fail)
POST http://localhost:5000/api/students
Authorization: Bearer <accountant_token>
{
  "name": "Jane Smith",
  "rollNo": "2024002",
  "class": "10",
  "section": "B"
}

Expected Response: 403 Forbidden
{
  "success": false,
  "message": "Access forbidden. Insufficient permissions.",
  "error": "This action requires one of the following roles: ADMIN",
  "yourRole": "ACCOUNTANT"
}
```

---

### **Test 3: Accountant Views Students** ✅

```bash
# Get all students (Should succeed)
GET http://localhost:5000/api/students
Authorization: Bearer <accountant_token>

Expected Response: 200 OK
{
  "success": true,
  "students": [...]
}
```

---

### **Test 4: Accountant Tries to Access Employees** ❌

```bash
# Try to get employees (Should fail)
GET http://localhost:5000/api/employees
Authorization: Bearer <accountant_token>

Expected Response: 403 Forbidden
{
  "success": false,
  "message": "Access forbidden. Insufficient permissions.",
  "error": "This action requires one of the following roles: ADMIN",
  "yourRole": "ACCOUNTANT"
}
```

---

### **Test 5: Accountant Manages Fees** ✅

```bash
# Create Fee (Should succeed)
POST http://localhost:5000/api/fees
Authorization: Bearer <accountant_token>
{
  "studentId": 1,
  "amount": 5000,
  "month": "2025-01"
}

Expected Response: 201 Created
```

---

## ⚠️ Error Responses

### **401 Unauthorized** - No or Invalid Token

```json
{
  "success": false,
  "message": "No token provided. Please login."
}
```

or

```json
{
  "success": false,
  "message": "Invalid or expired token."
}
```

---

### **403 Forbidden** - Insufficient Permissions

```json
{
  "success": false,
  "message": "Access forbidden. Insufficient permissions.",
  "error": "This action requires one of the following roles: ADMIN",
  "yourRole": "ACCOUNTANT"
}
```

---

## 🔒 Security Best Practices Implemented

1. ✅ **Token-Based Authentication** - JWT tokens with expiration
2. ✅ **Role Validation** - Every protected route checks user role
3. ✅ **Secure Password Storage** - bcrypt hashing
4. ✅ **Environment Variables** - Secrets stored in .env
5. ✅ **Error Handling** - Consistent error messages
6. ✅ **CORS Configuration** - Restricts API access
7. ✅ **Input Validation** - All inputs validated before processing
8. ✅ **Multi-Layer Security** - Auth → Role → Business Logic

---

## 📊 Integration with Frontend

### **Frontend Request Example:**

```javascript
// Admin creates a student
import studentService from './services/studentService';

const newStudent = {
  name: "John Doe",
  rollNo: "2024001",
  class: "10",
  section: "A"
};

try {
  const response = await studentService.create(newStudent);
  // Success - Student created
} catch (error) {
  if (error.response?.status === 403) {
    // Forbidden - User doesn't have permission
    alert("You don't have permission to create students");
  }
}
```

### **Backend Automatically:**
1. ✅ Verifies JWT token from Authorization header
2. ✅ Checks if user role is ADMIN
3. ✅ Processes request if authorized
4. ✅ Returns appropriate error if unauthorized

---

## 🎯 Summary

| Feature | Status |
|---------|--------|
| JWT Authentication | ✅ Implemented |
| Role-Based Routes | ✅ Implemented |
| Admin Full Access | ✅ Implemented |
| Accountant Limited Access | ✅ Implemented |
| Employee Protection | ✅ Admin Only |
| Student Read-Only for Accountant | ✅ Implemented |
| Fee/Salary Full Access | ✅ Both Roles |
| Error Handling | ✅ Implemented |
| Frontend Integration | ✅ Perfect Sync |

---

**🔐 Backend RBAC is Production-Ready!**

Built with security-first approach by **Yuxor Company**

