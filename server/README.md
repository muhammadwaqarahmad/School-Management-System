# School Management System - Backend

A comprehensive School Management System API built with Node.js, Express, Prisma, and PostgreSQL.

## 🚀 Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin, Accountant)
  - Secure password hashing with bcrypt

- **Student Management**
  - CRUD operations for students
  - Fee tracking per student
  - Filter by class and section

- **Employee Management**
  - CRUD operations for employees
  - Salary tracking per employee
  - Position-based organization

- **Fee Management**
  - Create and track student fees
  - Mark fees as paid/unpaid
  - Filter by month, student, payment status

- **Salary Management**
  - Create and track employee salaries
  - Mark salaries as paid/unpaid
  - Filter by month, employee, payment status

- **Financial Reports**
  - Financial overview dashboard
  - Monthly fee and salary reports
  - Student fee history
  - Employee salary history
  - Defaulters list (unpaid fees)

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
```bash
cd server
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up PostgreSQL**
   - Install PostgreSQL if not already installed
   - Create a database named `school_management`
   ```sql
   CREATE DATABASE school_management;
   ```

4. **Configure Environment Variables**
   - Create a `.env` file in the server directory
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/school_management?schema=public"
   JWT_SECRET="your-secret-key-change-in-production"
   JWT_EXPIRES_IN="24h"
   PORT=5000
   NODE_ENV="development"
   CLIENT_URL="http://localhost:3000"
   ```
   - Replace `YOUR_PASSWORD` with your PostgreSQL password

5. **Generate Prisma Client**
```bash
npx prisma generate
```

6. **Push Database Schema**
```bash
npx prisma db push
```

7. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
server/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/
│   ├── controllers/           # Route controllers
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   ├── employeeController.js
│   │   ├── feeController.js
│   │   ├── salaryController.js
│   │   └── reportController.js
│   ├── middleware/            # Custom middleware
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   └── errorHandler.js
│   ├── routes/                # API routes
│   │   ├── authRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── employeeRoutes.js
│   │   ├── feeRoutes.js
│   │   ├── salaryRoutes.js
│   │   └── reportRoutes.js
│   ├── utils/                 # Utility functions
│   │   ├── constants.js
│   │   ├── validators.js
│   │   └── jwt.js
│   ├── app.js                 # Express app setup
│   └── server.js              # Server entry point
├── .env                       # Environment variables
├── package.json
└── README.md
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (Protected)

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get single student
- `POST /api/students` - Create student (Admin/Accountant)
- `PUT /api/students/:id` - Update student (Admin/Accountant)
- `DELETE /api/students/:id` - Delete student (Admin only)

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get single employee
- `POST /api/employees` - Create employee (Admin only)
- `PUT /api/employees/:id` - Update employee (Admin only)
- `DELETE /api/employees/:id` - Delete employee (Admin only)

### Fees
- `GET /api/fees` - Get all fees
- `GET /api/fees/:id` - Get single fee
- `POST /api/fees` - Create fee (Admin/Accountant)
- `PUT /api/fees/:id` - Update fee (Admin/Accountant)
- `PATCH /api/fees/:id/pay` - Mark as paid (Admin/Accountant)
- `DELETE /api/fees/:id` - Delete fee (Admin/Accountant)

### Salaries
- `GET /api/salaries` - Get all salaries
- `GET /api/salaries/:id` - Get single salary
- `POST /api/salaries` - Create salary (Admin/Accountant)
- `PUT /api/salaries/:id` - Update salary (Admin/Accountant)
- `PATCH /api/salaries/:id/pay` - Mark as paid (Admin/Accountant)
- `DELETE /api/salaries/:id` - Delete salary (Admin/Accountant)

### Reports
- `GET /api/reports/overview` - Financial overview
- `GET /api/reports/fees/month/:month` - Monthly fee report
- `GET /api/reports/salaries/month/:month` - Monthly salary report
- `GET /api/reports/student/:studentId/fees` - Student fee history
- `GET /api/reports/employee/:employeeId/salaries` - Employee salary history
- `GET /api/reports/defaulters` - Students with unpaid fees

📖 See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API documentation.

## 🧪 Testing

Test the API using:
- Postman
- Thunder Client (VS Code extension)
- cURL commands

Example:
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@school.com","password":"admin123","role":"ADMIN"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"admin123"}'
```

## 🔒 Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token-based authentication
- Role-based access control
- Input validation
- SQL injection prevention (Prisma ORM)
- CORS configuration
- Environment variable protection

## 🛡️ Error Handling

- Centralized error handling middleware
- Prisma error handling
- JWT error handling
- Validation error handling
- Custom error messages

## 📊 Database Schema

The application uses PostgreSQL with the following models:
- **User** - System users (Admin, Accountant)
- **Student** - Student information
- **Employee** - Employee information
- **Fee** - Student fee records
- **Salary** - Employee salary records

## 🔄 Database Commands

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Create migration
npx prisma migrate dev --name init

# Open Prisma Studio (Database GUI)
npx prisma studio

# Reset database
npx prisma migrate reset
```

## 🌟 Best Practices Implemented

- ✅ RESTful API design
- ✅ MVC architecture pattern
- ✅ Environment-based configuration
- ✅ Input validation
- ✅ Error handling
- ✅ Authentication & Authorization
- ✅ Logging (Morgan)
- ✅ Clean code structure
- ✅ Async/await for database operations
- ✅ Secure password handling

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT | Required |
| `JWT_EXPIRES_IN` | Token expiration time | 24h |
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |
| `CLIENT_URL` | Frontend URL for CORS | * |

## 🐛 Troubleshooting

### Prisma Client Not Generated
```bash
npx prisma generate
```

### Database Connection Error
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Ensure database exists

### Port Already in Use
- Change PORT in .env
- Or kill process using port 5000

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

School Management System Backend

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

**Happy Coding! 🚀**

Useer: Admin
Register:
$body = @{
    name = "Admin User"
    email = "admin@school.com"
    password = "admin123"
    role = "ADMIN"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $body -ContentType "application/json"

Login:
$body = @{
    email = "admin@school.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $response.data.token
Write-Host "Your Token: $token"


# Replace YOUR_TOKEN_HERE with the actual token you got above
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzYxNjc0NTYxLCJleHAiOjE3NjE3NjA5NjF9.dxRpxqGg6ikSIPYANAPnfXCHyuWwadaUKOe62N-R4X4"

$headers = @{
    Authorization = "Bearer $token"
}

$body = @{
    name = "Ali Ahmed"
    rollNo = "2024001"
    class = "10"
    section = "A"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/students" -Method POST -Headers $headers -Body $body -ContentType "application/json"


user: Accountant 


$body = @{
    name = "Accountant User"
    email = "accountant@school.com"  # Different email!
    password = "accountant123"
    role = "ACCOUNTANT"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $body -ContentType "application/json"