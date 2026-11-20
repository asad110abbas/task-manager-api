import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/errors.js";
import { createTaskSchema, listQuerySchema, updateTaskSchema } from "../schemas/index.js";
import type { Store } from "../services/store.js";

export function taskRouter(store: Store) {
  const r = Router();
  r.use(requireAuth);

  r.get("/", (req: AuthedRequest, res, next) => {
    try {
      res.json(store.listTasks(req.userId!, listQuerySchema.parse(req.query)));
    } catch (e) {
      next(e);
    }
  });

  r.get("/stats", (req: AuthedRequest, res) => res.json(store.stats(req.userId!)));

  r.post("/", (req: AuthedRequest, res, next) => {
    try {
      res.status(201).json(store.createTask(req.userId!, createTaskSchema.parse(req.body)));
    } catch (e) {
      next(e);
    }
  });

  r.get("/:id", (req: AuthedRequest, res, next) => {
    const t = store.getTask(req.userId!, req.params.id);
    return t ? res.json(t) : next(new HttpError(404, "task not found"));
  });

  r.patch("/:id", (req: AuthedRequest, res, next) => {
    try {
      const t = store.updateTask(req.userId!, req.params.id, updateTaskSchema.parse(req.body));
      return t ? res.json(t) : next(new HttpError(404, "task not found"));
    } catch (e) {
      next(e);
    }
  });

  r.delete("/:id", (req: AuthedRequest, res, next) =>
    store.deleteTask(req.userId!, req.params.id) ? res.status(204).end() : next(new HttpError(404, "task not found")),
  );

  return r;
}
