import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

// Import middlewares
import requestLogger from './middleware/requestLogger.js';
import errorHandler from './middleware/errorHandler.js';
import { protect, authorize } from './middleware/auth.middleware.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import departmentRoutes from './routes/department.routes.js';
import teamRoutes from './routes/team.routes.js';
import projectRoutes from './routes/project.routes.js';
import taskRoutes from './routes/task.routes.js';
import leaveRoutes from './routes/leave.routes.js';
import announcementRoutes from './routes/announcement.routes.js';
import documentRoutes from './routes/document.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import activityRoutes from './routes/activity.routes.js';
import searchRoutes from './routes/search.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import meetingRoutes from './routes/meeting.routes.js';
import settingsRoutes from './routes/settings.routes.js';

dotenv.config();

const app = express();

// Standard Middlewares with CORS configured for HttpOnly cookies credentials
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests
app.use(morgan('dev'));
app.use(requestLogger);

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, status: 'OK', timestamp: new Date() });
});

// Mount Routes
app.use('/api/auth', authRoutes);

// Protected routes with role-based access
app.use('/api/employees', protect, employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/teams', protect, teamRoutes);
app.use('/api/projects', protect, projectRoutes);
app.use('/api/tasks', protect, taskRoutes);
app.use('/api/leaves', protect, leaveRoutes);
app.use('/api/announcements', protect, announcementRoutes);
app.use('/api/documents', protect, documentRoutes);
app.use('/api/notifications', protect, notificationRoutes);
app.use('/api/activity-logs', protect, authorize('Admin'), activityRoutes);
app.use('/api/search', protect, searchRoutes);
app.use('/api/analytics', protect, authorize('Admin', 'Manager', 'Team Lead'), analyticsRoutes);
app.use('/api/meetings', protect, meetingRoutes);
app.use('/api/settings', protect, settingsRoutes);

// 404 Route handler for APIs
app.use('/api/*', (req, res, next) => {
  const error = new Error(`API endpoint not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
