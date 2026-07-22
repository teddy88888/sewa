import type { IncomingMessage, ServerResponse } from "http";
import app from "./app";
import { logger } from "./lib/logger";

// Vercel serverless handler — Express 5 apps are callable directly (req, res) => void
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req, res);
}

// Start the HTTP server when not running on Vercel (e.g. local dev, Docker)
if (!process.env.VERCEL) {
  const rawPort = process.env["PORT"];

  if (!rawPort) {
    throw new Error(
      "PORT environment variable is required but was not provided.",
    );
  }

  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}
