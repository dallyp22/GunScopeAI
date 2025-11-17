import express from "express";
import { createServer } from "http";

const app = express();

app.get("/api/ping", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "healthy" });
});

const httpServer = createServer(app);
const port = process.env.PORT ? parseInt(process.env.PORT) : 5001;

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`✅ Minimal test server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Database URL set: ${!!process.env.DATABASE_URL}`);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

