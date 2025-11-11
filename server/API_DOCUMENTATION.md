# School Management System - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require a JWT token. Include it in the Authorization header:
```
Authorization: Bearer <your_token>
```

## User Roles
- **ADMIN**: Full access to all features
- **ACCOUNTANT**: Access to students, fees, salaries, and reports (limited delete permissions)

---

## 📌 Authentication Endpoints

### Register User
**POST** `/auth/register`

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "ADMIN"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful.",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
**POST** `/auth/login`

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "ADMIN"
    }
  }
}
```

### Get Profile
**GET** `/auth/profile`
- **Auth Required:** Yes

---

## 👨‍🎓 Student Endpoints

### Get All Students
**GET** `/students`
- **Auth Required:** Yes
- **Query Params:** `class`, `section`

**Example:** `/students?class=10&section=A`

### Get Single Student
**GET** `/students/:id`
- **Auth Required:** Yes

### Create Student
**POST** `/students`
- **Auth Required:** Yes (Admin/Accountant)

**Body:**
```json
{
  "name": "Alice Smith",
  "rollNo": "2024001",
  "class": "10",
  "section": "A"
}
```

### Update Student
**PUT** `/students/:id`
- **Auth Required:** Yes (Admin/Accountant)

### Delete Student
**DELETE** `/students/:id`
- **Auth Required:** Yes (Admin only)

---

## 👨‍💼 Employee Endpoints

### Get All Employees
**GET** `/employees`
- **Auth Required:** Yes

### Get Single Employee
**GET** `/employees/:id`
- **Auth Required:** Yes

### Create Employee
**POST** `/employees`
- **Auth Required:** Yes (Admin only)

**Body:**
```json
{
  "name": "Robert Johnson",
  "position": "Teacher"
}
```

### Update Employee
**PUT** `/employees/:id`
- **Auth Required:** Yes (Admin only)

### Delete Employee
**DELETE** `/employees/:id`
- **Auth Required:** Yes (Admin only)

---

## 💰 Fee Endpoints

### Get All Fees
**GET** `/fees`
- **Auth Required:** Yes
- **Query Params:** `studentId`, `paid`, `month`

**Example:** `/fees?paid=false&month=January`

### Get Single Fee
**GET** `/fees/:id`
- **Auth Required:** Yes

### Create Fee
**POST** `/fees`
- **Auth Required:** Yes (Admin/Accountant)

**Body:**
```json
{
  "amount": 5000,
  "month": "January",
  "paid": false,
  "studentId": 1
}
```

### Update Fee
**PUT** `/fees/:id`
- **Auth Required:** Yes (Admin/Accountant)

### Mark Fee as Paid
**PATCH** `/fees/:id/pay`
- **Auth Required:** Yes (Admin/Accountant)

### Delete Fee
**DELETE** `/fees/:id`
- **Auth Required:** Yes (Admin/Accountant)

---

## 💵 Salary Endpoints

### Get All Salaries
**GET** `/salaries`
- **Auth Required:** Yes
- **Query Params:** `employeeId`, `paid`, `month`

### Get Single Salary
**GET** `/salaries/:id`
- **Auth Required:** Yes

### Create Salary
**POST** `/salaries`
- **Auth Required:** Yes (Admin/Accountant)

**Body:**
```json
{
  "amount": 50000,
  "month": "January",
  "paid": false,
  "employeeId": 1
}
```

### Update Salary
**PUT** `/salaries/:id`
- **Auth Required:** Yes (Admin/Accountant)

### Mark Salary as Paid
**PATCH** `/salaries/:id/pay`
- **Auth Required:** Yes (Admin/Accountant)

### Delete Salary
**DELETE** `/salaries/:id`
- **Auth Required:** Yes (Admin/Accountant)

---

## 📊 Report Endpoints

### Financial Overview
**GET** `/reports/overview`
- **Auth Required:** Yes (Admin/Accountant)

**Response:**
```json
{
  "success": true,
  "data": {
    "students": { "total": 150 },
    "employees": { "total": 20 },
    "fees": {
      "total": 750000,
      "paid": { "amount": 500000, "count": 100 },
      "unpaid": { "amount": 250000, "count": 50 }
    },
    "salaries": {
      "total": 1000000,
      "paid": { "amount": 800000, "count": 15 },
      "unpaid": { "amount": 200000, "count": 5 }
    },
    "netProfit": -300000
  }
}
```

### Monthly Fee Report
**GET** `/reports/fees/month/:month`
- **Auth Required:** Yes (Admin/Accountant)

**Example:** `/reports/fees/month/January`

### Monthly Salary Report
**GET** `/reports/salaries/month/:month`
- **Auth Required:** Yes (Admin/Accountant)

### Student Fee History
**GET** `/reports/student/:studentId/fees`
- **Auth Required:** Yes

### Employee Salary History
**GET** `/reports/employee/:employeeId/salaries`
- **Auth Required:** Yes

### Get Defaulters
**GET** `/reports/defaulters`
- **Auth Required:** Yes (Admin/Accountant)
- Returns list of students with unpaid fees

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": ["Array of validation errors if applicable"]
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized (No token or invalid token)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Testing the API

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@school.com","password":"admin123","role":"ADMIN"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"admin123"}'
```

**Get Students (with token):**
```bash
curl -X GET http://localhost:5000/api/students \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman or Thunder Client
1. Create a new request
2. Set the method and URL
3. Add Authorization header with Bearer token
4. Add request body for POST/PUT requests

---

## Environment Variables

Create a `.env` file in the server directory:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/school_management?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="24h"
PORT=5000
NODE_ENV="development"
CLIENT_URL="http://localhost:3000"
```

---

## Database Setup

1. Make sure PostgreSQL is running
2. Run Prisma commands:
```bash
npx prisma generate
npx prisma db push
```

3. (Optional) Seed the database with sample data

---

## Running the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

---

## Notes

- All timestamps are in ISO 8601 format
- Amounts are stored as Float (decimal numbers)
- IDs are auto-incrementing integers
- Email must be unique for users
- Roll number must be unique for students

