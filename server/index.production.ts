import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import { existsSync } from "fs";

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 UNHANDLED REJECTION:', reason);
  process.exit(1);
});

console.log('🚀 GunScope AI starting (production mode)...');
console.log('📦 Node:', process.version);
console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('🔌 Database configured:', !!process.env.DATABASE_URL);

const app = express();

// CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Import routes dynamically to avoid bundling issues
const { registerRoutes } = await import("./routes.js");
const server = await registerRoutes(app);

if (!server) {
  console.error('Failed to create server');
  process.exit(1);
}

// Serve static files in production
const distPath = path.join(process.cwd(), "dist", "public");
console.log('📁 Static files path:', distPath);

if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  console.log('✅ Static files configured');
} else {
  console.warn('⚠️  Static files not found at:', distPath);
}

// Start server
const port = process.env.PORT ? parseInt(process.env.PORT) : 5001;
server.listen(port, "0.0.0.0", () => {
  console.log(`✅ 🔫 GunScope AI serving on port ${port}`);
  console.log(`🌐 Healthcheck: http://localhost:${port}/api/ping`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM - shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT - shutting down gracefully');
  server.close(() => process.exit(0));
});

