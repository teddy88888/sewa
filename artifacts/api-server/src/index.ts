import type { IncomingMessage, ServerResponse } from "http";
import app from "./app";
import { logger } from "./lib/logger";

/**
 * Vercel serverless handler
 * Wraps Express 5 app into an async handler. Express 5 app(req, res) returns void,
 * so we wrap it in a promise to ensure Vercel waits for the response to complete.
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
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
