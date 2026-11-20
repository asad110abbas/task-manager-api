import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middleware/errors.js";
import { authRouter } from "./routes/auth.js";
import { taskRouter } from "./routes/tasks.js";
import { Store } from "./services/store.js";

export function createApp(store = new Store()) {
  const app = express();
  app.use(helmet());
  app.use(express.json({ limit: "100kb" }));
  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRouter(store));
  app.use("/api/tasks", taskRouter(store));
  app.use((_req, res) => res.status(404).json({ error: "not_found" }));
  app.use(errorHandler);
  return app;
}
