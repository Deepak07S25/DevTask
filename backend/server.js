require("dotenv").config(); // MUST BE LINE 1
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const env = require("./src/config/env");

const authRoutes = require("./src/routes/authRoutes"); // This MUST come after dotenv
const projectRoutes = require("./src/routes/projectRoutes");
const taskRoutes = require("./src/routes/taskRoutes");
const sprintRoutes = require("./src/routes/sprintRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");

const app = express();

// Security Headers (OWASP default)
app.use(helmet());

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: env.frontendUrl, // Dynamically sourced from env instead of hardcoded
    credentials: true,
    exposedHeaders: ['X-Total-Count', 'X-Total-Pages'],
  })
);

// Global App Rate Limiter (Protects against sweeping scrapers)
app.set("trust proxy", 1); // Trust first proxy for rate limiting (Load Balancers/Nginx)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500, // Safe blanket limit for normal UI behavior
  message: { error: "Too many requests to the server, please try again later" },
});
app.use("/api", globalLimiter);

// Apply specific rate limits to Authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: { error: "Too many requests from this IP, please try again after 15 minutes" },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Stricter limit: 5 requests per 15 minutes for login
  message: { error: "Too many login attempts from this IP, please try again after 15 minutes" },
});

app.use("/api/projects", projectRoutes);
// MUST come before the general authRoutes wildcard definition to establish priority
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/sprints", sprintRoutes);
app.use("/api/notifications", notificationRoutes);

// Global Error Handler (Must be defined last)
const { errorHandler } = require("./src/middlewares/errorHandler");
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} in ${env.isProduction ? 'production' : 'development'} mode`));

// Initialize Socket.io on the same HTTP server
const { initializeSocket } = require("./src/config/socket");
initializeSocket(server, env.frontendUrl);

// --- Startup Hardening & Graceful Shutdown ---
const shutdown = () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    const prisma = require('./src/db/client');
    prisma.$disconnect().then(() => {
      console.log('Database connections closed.');
      process.exit(0);
    });
  });

  // Force close after 10s
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown after 10s timeout');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
    if (env.isProduction) {
        // In true prod, unhandled rejections should restart the process
        console.error('Shutting down due to unhandled rejection...');
        shutdown();
    }
});

