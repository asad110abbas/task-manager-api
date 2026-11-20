# ✅ BRIHA · Task Manager API

![BRIHA](https://img.shields.io/badge/Part_of-BRIHA-8B5CF6?style=for-the-badge&labelColor=0B1024) ![Module](https://img.shields.io/badge/Briha-Engineering-00F0FF?style=for-the-badge&labelColor=0B1024)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js_22-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-validation-3E67B1)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)
![CI](https://github.com/asad110abbas/task-manager-api/actions/workflows/ci.yml/badge.svg)

> ⚡ **Part of [BRIHA](https://github.com/asad110abbas)**, built by Syed Asad Abbas.

A clean, typed **REST API** for personal task management: JWT authentication, schema validation, filtering,
search, sorting, pagination, per-user data isolation and stats, all covered by integration tests.

## Endpoints
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create an account, returns a JWT |
| `POST` | `/api/auth/login` | Log in, returns a JWT |
| `GET` | `/api/tasks?status=&priority=&tag=&q=&sort=&page=&limit=` | List with filters, search, sort, pagination |
| `POST` | `/api/tasks` | Create a task |
| `GET` | `/api/tasks/:id` | Get one task |
| `PATCH` | `/api/tasks/:id` | Partial update |
| `DELETE` | `/api/tasks/:id` | Delete |
| `GET` | `/api/tasks/stats` | Counts by status and overdue tasks |
| `GET` | `/health` | Health check |

## Design
- **Layered**: routes → schemas (Zod) → repository (`Store`), so the in-memory store can be swapped for Postgres without touching routes
- **Validation** with Zod, with consistent `400 validation_error` responses that include field details
- **Security**: bcrypt password hashing, JWT bearer auth, Helmet headers, body size limit, owner checks on every task
- **Testing**: Vitest + Supertest integration tests for auth, CRUD, validation, search/pagination and isolation

## Run
```bash
npm install
npm run dev            # http://localhost:3000
npm test
```
```bash
curl -X POST localhost:3000/api/auth/register -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"supersecret","name":"Me"}'
```
Set `JWT_SECRET` in production. Docker: `docker build -t task-api . && docker run -p 3000:3000 -e JWT_SECRET=... task-api`
