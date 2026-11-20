import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

let app: ReturnType<typeof createApp>;
let token: string;

async function register(email = "dev@example.com") {
  const res = await request(app).post("/api/auth/register").send({ email, password: "supersecret", name: "Dev" });
  return res.body.token as string;
}

beforeEach(async () => {
  app = createApp();
  token = await register();
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe("auth", () => {
  it("rejects duplicate registration", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "dev@example.com", password: "supersecret", name: "X" });
    expect(res.status).toBe(409);
  });

  it("logs in with correct password only", async () => {
    expect((await request(app).post("/api/auth/login").send({ email: "dev@example.com", password: "supersecret" })).status).toBe(200);
    expect((await request(app).post("/api/auth/login").send({ email: "dev@example.com", password: "wrong" })).status).toBe(401);
  });

  it("protects task routes", async () => {
    expect((await request(app).get("/api/tasks")).status).toBe(401);
  });
});

describe("tasks", () => {
  it("creates, reads, updates and deletes a task", async () => {
    const created = await request(app).post("/api/tasks").set(auth()).send({ title: "Write README", priority: "high" });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe("todo");
    const id = created.body.id;

    const updated = await request(app).patch(`/api/tasks/${id}`).set(auth()).send({ status: "done" });
    expect(updated.body.status).toBe("done");

    expect((await request(app).delete(`/api/tasks/${id}`).set(auth())).status).toBe(204);
    expect((await request(app).get(`/api/tasks/${id}`).set(auth())).status).toBe(404);
  });

  it("validates input", async () => {
    const res = await request(app).post("/api/tasks").set(auth()).send({ title: "", priority: "urgent" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
  });

  it("filters, searches and paginates", async () => {
    for (const [title, priority] of [["Fix bug", "high"], ["Plan sprint", "low"], ["Fix tests", "medium"]]) {
      await request(app).post("/api/tasks").set(auth()).send({ title, priority });
    }
    const search = await request(app).get("/api/tasks?q=fix&sort=priority").set(auth());
    expect(search.body.total).toBe(2);
    expect(search.body.items[0].title).toBe("Fix bug");
    const page = await request(app).get("/api/tasks?limit=1&page=2").set(auth());
    expect(page.body.items).toHaveLength(1);
  });

  it("isolates tasks between users", async () => {
    const created = await request(app).post("/api/tasks").set(auth()).send({ title: "Private" });
    const other = await register("other@example.com");
    const res = await request(app).get(`/api/tasks/${created.body.id}`).set({ Authorization: `Bearer ${other}` });
    expect(res.status).toBe(404);
  });

  it("reports stats", async () => {
    await request(app).post("/api/tasks").set(auth()).send({ title: "Old", dueDate: "2020-01-01T00:00:00.000Z" });
    const stats = await request(app).get("/api/tasks/stats").set(auth());
    expect(stats.body).toMatchObject({ total: 1, overdue: 1, byStatus: { todo: 1 } });
  });
});
