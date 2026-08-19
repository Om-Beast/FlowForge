<div align="center">

# ⚡ FlowForge

### Production-Grade Workflow Automation Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

**A distributed, event-driven workflow automation engine built for engineering depth — featuring a visual DAG builder, BullMQ-powered execution pipeline, durable step-level state, real-time Socket.IO monitoring, and a full analytics layer backed by PostgreSQL.**

[Architecture](#architecture) · [Getting Started](#getting-started) · [Features](#features) · [API Reference](#api-reference) · [Tech Stack](#tech-stack)

</div>

---

## Architecture

FlowForge is structured around a layered, event-driven architecture. The key insight is that workflow execution is fully decoupled from the HTTP request that triggers it — the API creates an execution record and enqueues a BullMQ job immediately, returning a `202 Accepted` with the execution ID. The client then subscribes to a Socket.IO room for live updates.

```mermaid
graph TD
    A[React 19 Frontend] -->|REST API| B[Express + TypeScript]
    A -->|Socket.IO| B
    B --> C[PostgreSQL / Prisma ORM]
    B --> D[Redis]
    D --> E[BullMQ Queue]
    E --> F[Workflow Worker]
    F --> G[DAG Execution Engine]
    G --> H[Node Executors\nWEBHOOK · CONDITION · DELAY\nHTTP_REQUEST · EMAIL · SLACK\nTRANSFORM · FILTER]
    G --> C
    F --> I[EventBus]
    I --> J[Socket.IO Server]
    J --> A
```

### Execution Lifecycle

```
POST /api/v1/workflows/:id/execute
        │
        ▼
  Create WorkflowExecution { status: PENDING }
        │
        ▼
  Enqueue BullMQ job (executionId as jobId)
        │
        ▼
  Return 202 + { executionId, socketRoom }
        │
        ▼  (async — Worker picks up job)
  Update execution → RUNNING
  Publish execution:started → Socket.IO → client
        │
        ▼
  Load workflow definition from PostgreSQL
  Validate DAG (Kahn's topological sort)
        │
        ▼
  BFS traversal of nodes (respects conditional branches)
  For each node:
    Create ExecutionStep { status: RUNNING }
    Run node executor (WEBHOOK / CONDITION / DELAY / ...)
    Update ExecutionStep { status: COMPLETED | FAILED, output, durationMs }
    Publish execution:step → Socket.IO → client
    Propagate output to context for downstream nodes
        │
        ▼
  Update WorkflowExecution { status: COMPLETED | FAILED, durationMs }
  Publish execution:completed | execution:failed → Socket.IO → client
  Create Notification record
  BullMQ retries on failure (exponential backoff, configurable attempts)
```

### Module Architecture

```
server/src/
├── modules/
│   ├── auth/          # JWT auth, bcrypt, refresh token rotation
│   ├── workflow/      # CRUD, DAG validation, execution trigger
│   ├── queue/         # BullMQ queue management, metrics
│   ├── worker/        # BullMQ worker, node executor registry
│   ├── analytics/     # Execution time-series, summary stats
│   ├── dashboard/     # Aggregated metrics + queue health
│   ├── logs/          # Paginated execution history + steps
│   ├── notifications/ # In-app notification store
│   └── scheduler/     # Cron-based workflow scheduling
├── events/            # Typed EventBus (Node EventEmitter)
├── websocket/         # Socket.IO server + JWT auth middleware
├── middleware/        # Auth, RBAC, validation (Zod), rate limit
├── services/          # Redis, Logger (Winston), Cache
└── shared/            # Enums, errors, interfaces, types
```

---

## Features

### Core Engine
- **DAG execution** — Kahn's algorithm validates no cycles; BFS traversal executes nodes in dependency order
- **Conditional branching** — CONDITION nodes route to `true_branch` or `false_branch` edges
- **Durable state** — every `WorkflowExecution` and `ExecutionStep` is persisted to PostgreSQL
- **Retry with exponential backoff** — BullMQ handles retries; `attemptsMade` tracked on executions
- **Dead letter queue** — permanently failed jobs retained for inspection

### Node Types (all backend-executed)

| Node | Behavior |
|------|----------|
| `WEBHOOK` | Trigger node — captures incoming context |
| `CONDITION` | Evaluates field comparisons (`eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `contains`, `exists`) |
| `DELAY` | Async sleep up to 30 seconds |
| `HTTP_REQUEST` | Real HTTP calls with configurable method, headers, body; 10s timeout |
| `EMAIL` | Simulated send (SMTP configurable via env) |
| `SLACK` | Posts to Slack webhook URL if configured |
| `TRANSFORM` | Maps fields from execution context |
| `FILTER` | Passes/blocks based on multi-condition evaluation |

### Real-Time Monitoring
- Socket.IO server with JWT authentication middleware
- User-scoped rooms (`user:<id>`) — events never leak between users
- Workflow rooms (`workflow:<id>`) and execution rooms (`execution:<id>`)
- Events: `execution:started`, `execution:step`, `execution:completed`, `execution:failed`, `queue:metrics`, `notification`
- Queue metrics broadcast every 5 seconds

### Frontend
- Visual drag-and-drop workflow builder (React Flow / @xyflow/react)
- Node palette with categorized node types
- Per-node configuration panel
- Undo/redo history
- Auto-layout
- Live execution status overlays on nodes (running/completed/failed)
- Execution logs with step drill-down
- Analytics with time-series charts (Recharts)
- Real-time queue monitoring dashboard

### Security
- JWT access tokens (15m) + refresh tokens (7d) with rotation
- bcrypt password hashing (12 rounds)
- RBAC: `ADMIN` and `USER` roles
- Zod request validation on all mutations
- Helmet CSP headers
- Rate limiting on API prefix
- User isolation enforced at data layer (all queries scoped to `userId`)
- No secrets or stack traces in API responses

---

## Getting Started

### Prerequisites

- Node.js >= 20
- Docker & Docker Compose
- npm >= 10

### Quick Start

```bash
# Clone and enter the repository
git clone https://github.com/yourusername/flowforge.git
cd flowforge

# Copy environment file
cp .env.example .env

# Start infrastructure + app
docker compose up -d

# Run database migrations (first time only)
docker compose exec server npx prisma migrate deploy

# Frontend:  http://localhost:3000
# Backend:   http://localhost:4000
# API docs:  http://localhost:4000/health
```

### Local Development

```bash
# Start infrastructure
docker compose up postgres redis -d

# Backend
cd server
cp .env.example .env          # defaults work for local Docker
npm install
npx prisma migrate dev
npm run dev                   # http://localhost:4000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

### Development with GUI Tools

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# pgAdmin:           http://localhost:5050  (admin@flowforge.dev / admin)
# Redis Commander:   http://localhost:8081
# Frontend (Vite):   http://localhost:5173
# Backend:           http://localhost:4000
```

---

## Environment Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://flowforge:flowforge_secret@localhost:5432/flowforge_db` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `JWT_SECRET` | Access token signing secret | — must set in production |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | — must set in production |
| `JWT_ACCESS_EXPIRY` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token TTL | `7d` |
| `BCRYPT_SALT_ROUNDS` | bcrypt work factor | `12` |
| `CORS_ORIGIN` | Allowed origins for CORS | `http://localhost:5173` |
| `LOG_LEVEL` | Winston log level | `debug` |
| `PORT` | HTTP server port | `4000` |
| `VITE_API_URL` | Frontend API base URL | `http://localhost:4000/api/v1` |
| `VITE_WS_URL` | Frontend WebSocket URL | `http://localhost:4000` |

---

## API Reference

All endpoints are prefixed with `/api/v1`.

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Register new account |
| `POST` | `/auth/login` | Login, returns access + refresh tokens |
| `POST` | `/auth/refresh` | Exchange refresh token for new access token |
| `GET` | `/auth/me` | Get current user |
| `POST` | `/auth/logout` | Invalidate refresh token |

### Workflows

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/workflows` | Paginated list (filter by status, search) |
| `POST` | `/workflows` | Create workflow with definition |
| `GET` | `/workflows/:id` | Get single workflow |
| `PATCH` | `/workflows/:id` | Update name, definition, status |
| `DELETE` | `/workflows/:id` | Delete workflow + cascades |
| `POST` | `/workflows/validate` | Validate DAG without persisting |
| `POST` | `/workflows/:id/execute` | Trigger execution → 202 + executionId |
| `POST` | `/workflows/:id/activate` | Set status ACTIVE |
| `POST` | `/workflows/:id/deactivate` | Set status INACTIVE |
| `GET` | `/workflows/:id/executions` | Execution history for workflow |

### Monitoring & Analytics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dashboard` | Aggregated stats + recent executions + queue health |
| `GET` | `/analytics/summary` | Execution success/failure rates, avg duration |
| `GET` | `/analytics/time-series` | Daily execution counts (up to 90 days) |
| `GET` | `/analytics/workflow/:workflowId` | Per-workflow stats |
| `GET` | `/queues/stats` | Live BullMQ queue depth counters |
| `GET` | `/queues/failed` | Failed jobs list (admin only) |
| `GET` | `/workers/health` | Worker health + concurrency |
| `GET` | `/logs/executions` | Paginated execution history with steps |
| `GET` | `/logs/executions/:id` | Single execution with full step detail |

---

## Project Structure

```
flowforge/
├── server/                         # Express + TypeScript backend
│   ├── prisma/
│   │   ├── schema.prisma           # Full data model
│   │   ├── migrations/             # Prisma migration history
│   │   └── seed.ts                 # Development seed data
│   ├── src/
│   │   ├── config/                 # App, queue, Redis, JWT config
│   │   ├── database/               # Prisma client singleton
│   │   ├── events/                 # Typed EventBus
│   │   ├── middleware/             # Auth, RBAC, Zod validation, rate limit
│   │   ├── modules/                # Feature modules (see above)
│   │   ├── services/               # Redis, Logger, Cache
│   │   ├── shared/                 # Enums, errors, interfaces
│   │   ├── utils/                  # JWT, crypto, response helpers
│   │   ├── websocket/              # Socket.IO server + handlers
│   │   ├── app.ts                  # Express application factory
│   │   └── server.ts               # HTTP server + graceful shutdown
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                       # React 19 + Vite frontend
│   ├── src/
│   │   ├── components/             # Shared UI components (Badge, Spinner, etc.)
│   │   ├── hooks/                  # useWorkflows, useSocket, useAnalytics, useAuth
│   │   ├── layouts/                # RootLayout, AuthLayout, DashboardLayout
│   │   ├── pages/                  # Route pages (dashboard, workflows, logs, etc.)
│   │   ├── services/               # API client (axios), workflow/analytics/socket
│   │   ├── store/                  # Zustand stores (auth, socket, notifications)
│   │   ├── workflow/               # React Flow builder components + node registry
│   │   ├── App.tsx                 # React Router configuration
│   │   └── main.tsx                # App entry point
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml              # Production: postgres, redis, server, client
├── docker-compose.dev.yml          # Dev overrides + pgAdmin + Redis Commander
├── .env.example                    # Environment template
└── README.md
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend framework | React 19, TypeScript, Vite | UI rendering |
| Styling | Tailwind CSS v4, custom CSS variables | Design system |
| State | Zustand 5, TanStack Query v5 | Global + server state |
| Workflow builder | @xyflow/react 12 (React Flow) | Visual DAG editor |
| Charts | Recharts 2 | Analytics visualizations |
| Animations | Framer Motion 12 | Page/component transitions |
| Backend framework | Express 4, TypeScript 5 | HTTP API |
| ORM | Prisma 5 | Type-safe database access |
| Database | PostgreSQL 16 | Persistent workflow + execution state |
| Queue + broker | BullMQ 5, Redis 7 | Async job processing |
| Real-time | Socket.IO 4 | Execution event streaming |
| Auth | JWT (jsonwebtoken), bcrypt | Authentication |
| Validation | Zod 3 | Request schema validation |
| Logging | Winston 3 | Structured server logging |
| Containerization | Docker, Docker Compose | Local infrastructure |

---

## Key Engineering Decisions

**Why BullMQ over a simple queue?**
BullMQ provides job persistence in Redis, automatic retry with exponential backoff, dead letter queue semantics, job priority, and observable job state — all essential for a reliable execution engine. A simple in-memory queue would lose jobs on process restart.

**Why Socket.IO over Server-Sent Events?**
Socket.IO supports rooms (user-scoped, workflow-scoped, execution-scoped) which prevents event leakage between users. The bidirectional protocol also allows clients to subscribe/unsubscribe to specific execution rooms, reducing unnecessary traffic.

**Why DAG validation before execution?**
Running Kahn's topological sort at both save and execute time prevents infinite loops and catches dangling edge references before any compute resources are consumed. The validation result is returned to the frontend immediately so users get fast feedback.

**Why per-step state in PostgreSQL?**
Storing `ExecutionStep` records provides a durable audit trail independent of Redis job state. If the worker crashes mid-execution, the last persisted step state tells the operator exactly where execution stopped. This also powers the execution detail view without any Redis dependency.

---

## Roadmap

- [ ] Webhook trigger support (inbound HTTP → auto-execute)
- [ ] Cron scheduler UI
- [ ] Parallel node execution (Promise.all for fan-out patterns)
- [ ] Workflow versioning with rollback
- [ ] SMTP integration for EMAIL node
- [ ] Workflow import/export (JSON)
- [ ] Admin panel for cross-user execution management
- [ ] OpenTelemetry tracing

---

<div align="center">
  <strong>FlowForge — built for engineering depth, not just feature breadth.</strong>
</div>
