import { randomUUID } from "node:crypto";
import type { CreateTask, ListQuery, UpdateTask } from "../schemas/index.js";

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

export interface Task extends CreateTask {
  id: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

/** In-memory repository. Swap for a database-backed implementation with the same interface. */
export class Store {
  private users = new Map<string, User>();
  private tasks = new Map<string, Task>();

  createUser(email: string, name: string, passwordHash: string): User {
    const user = { id: randomUUID(), email: email.toLowerCase(), name, passwordHash };
    this.users.set(user.id, user);
    return user;
  }

  findUserByEmail(email: string): User | undefined {
    return [...this.users.values()].find((u) => u.email === email.toLowerCase());
  }

  createTask(ownerId: string, data: CreateTask): Task {
    const now = new Date().toISOString();
    const task: Task = { ...data, id: randomUUID(), ownerId, createdAt: now, updatedAt: now };
    this.tasks.set(task.id, task);
    return task;
  }

  getTask(ownerId: string, id: string): Task | undefined {
    const t = this.tasks.get(id);
    return t && t.ownerId === ownerId ? t : undefined;
  }

  updateTask(ownerId: string, id: string, patch: UpdateTask): Task | undefined {
    const t = this.getTask(ownerId, id);
    if (!t) return undefined;
    const updated = { ...t, ...patch, updatedAt: new Date().toISOString() };
    this.tasks.set(id, updated);
    return updated;
  }

  deleteTask(ownerId: string, id: string): boolean {
    return this.getTask(ownerId, id) ? this.tasks.delete(id) : false;
  }

  listTasks(ownerId: string, q: ListQuery) {
    let items = [...this.tasks.values()].filter((t) => t.ownerId === ownerId);
    if (q.status) items = items.filter((t) => t.status === q.status);
    if (q.priority) items = items.filter((t) => t.priority === q.priority);
    if (q.tag) items = items.filter((t) => t.tags.includes(q.tag!));
    if (q.q) {
      const needle = q.q.toLowerCase();
      items = items.filter((t) => `${t.title} ${t.description ?? ""}`.toLowerCase().includes(needle));
    }
    items.sort((a, b) => {
      if (q.sort === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (q.sort === "dueDate") return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
      return b.createdAt.localeCompare(a.createdAt);
    });
    const total = items.length;
    const start = (q.page - 1) * q.limit;
    return { items: items.slice(start, start + q.limit), page: q.page, limit: q.limit, total };
  }

  stats(ownerId: string) {
    const mine = [...this.tasks.values()].filter((t) => t.ownerId === ownerId);
    const now = new Date().toISOString();
    return {
      total: mine.length,
      byStatus: { todo: 0, in_progress: 0, done: 0, ...countBy(mine, "status") },
      overdue: mine.filter((t) => t.status !== "done" && t.dueDate && t.dueDate < now).length,
    };
  }
}

function countBy<T, K extends keyof T>(items: T[], key: K): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, it) => {
    const k = String(it[key]);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}
