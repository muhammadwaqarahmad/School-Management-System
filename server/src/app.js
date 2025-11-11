import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import feeRoutes from "./routes/feeRoutes.js";
import salaryRoutes from "./routes/salaryRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import classRoutes from "./routes/classRoutes.js";
import promotionRoutes from "./routes/promotionRoutes.js";
import sectionRoutes from "./routes/sectionRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/salaries", salaryRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/expenses", expenseRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to School Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      students: '/api/students',
      employees: '/api/employees',
      fees: '/api/fees',
      salaries: '/api/salaries',
      reports: '/api/reports',
      expenses: '/api/expenses'
    }
  });
});

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

export default app;
