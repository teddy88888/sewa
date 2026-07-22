/**
 * Vercel serverless entry point.
 * This is a minimal handler that avoids pino-http worker issues in serverless.
 */
import type { IncomingMessage, ServerResponse } from "http";
import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Health check on /api/healthz
app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// 404 for unknown API routes
app.use("/api/*", (_req, res) => {
  res.status(404).json({ error: "API route not found" });
});

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  logger.info({ method: req.method, url: req.url }, "Vercel request");
  await new Promise<void>((resolve, reject) => {
    res.on("finish", () => resolve());
    res.on("close", () => resolve());
    res.on("error", (err) => reject(err));

    try {
      app(req, res);
    } catch (err) {
      reject(err);
    }
  });
}
