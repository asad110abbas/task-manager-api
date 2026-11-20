import bcrypt from "bcryptjs";
import { Router } from "express";
import { signToken } from "../middleware/auth.js";
import { HttpError } from "../middleware/errors.js";
import { loginSchema, registerSchema } from "../schemas/index.js";
import type { Store } from "../services/store.js";

export function authRouter(store: Store) {
  const r = Router();

  r.post("/register", async (req, res, next) => {
    try {
      const body = registerSchema.parse(req.body);
      if (store.findUserByEmail(body.email)) throw new HttpError(409, "email already registered");
      const user = store.createUser(body.email, body.name, await bcrypt.hash(body.password, 10));
      res.status(201).json({ id: user.id, email: user.email, name: user.name, token: signToken(user.id) });
    } catch (e) {
      next(e);
    }
  });

  r.post("/login", async (req, res, next) => {
    try {
      const body = loginSchema.parse(req.body);
      const user = store.findUserByEmail(body.email);
      if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
        throw new HttpError(401, "invalid email or password");
      }
      res.json({ token: signToken(user.id) });
    } catch (e) {
      next(e);
    }
  });

  return r;
}
