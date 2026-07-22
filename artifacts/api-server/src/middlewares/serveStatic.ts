/**
 * Middleware untuk serve static frontend di production.
 * Hanya aktif saat NODE_ENV=production.
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

export function serveStaticFrontend() {
  if (process.env.NODE_ENV !== "production") {
    // Di development, frontend di-serve oleh Vite dev server
    return;
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const publicPath = path.resolve(__dirname, "../../dist/public");

  console.log(`[serveStatic] Serving frontend from: ${publicPath}`);

  // Serve static files
  express.static(publicPath);

  // Fallback ke index.html untuk SPA routing
  return (req, res, next) => {
    // Hanya handle non-API routes
    if (req.path.startsWith("/api")) {
      return next();
    }

    const staticPath = path.join(publicPath, req.path);
    const fs = require("fs");

    if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
      return res.sendFile(staticPath);
    }

    // SPA fallback
    res.sendFile(path.join(publicPath, "index.html"));
  };
}
