import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { pinoHttp } from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Root handler
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Sewa API",
    version: "0.0.0",
    endpoints: {
      health: "/api/healthz",
    },
  });
});

// ===== Local production only: Serve frontend static files =====
if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const publicPath = path.resolve(__dirname, "../../dist/public");

  logger.info({ publicPath }, "Serving frontend static files");

  app.use(express.static(publicPath));

  // SPA fallback: semua non-API routes → index.html
  app.get("*", (req: Request, res: Response) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "API route not found" });
    }
    return res.sendFile(path.join(publicPath, "index.html"));
  });
}

// 404 fallback for unmatched routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

export default app;
