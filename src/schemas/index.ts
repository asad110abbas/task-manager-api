import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "password must be at least 8 characters"),
  name: z.string().min(1).max(80),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const taskStatus = z.enum(["todo", "in_progress", "done"]);
export const taskPriority = z.enum(["low", "medium", "high"]);

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: taskStatus.default("todo"),
  priority: taskPriority.default("medium"),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).default([]),
});

export const updateTaskSchema = createTaskSchema.partial();

export const listQuerySchema = z.object({
  status: taskStatus.optional(),
  priority: taskPriority.optional(),
  tag: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["createdAt", "dueDate", "priority"]).default("createdAt"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateTask = z.infer<typeof createTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
