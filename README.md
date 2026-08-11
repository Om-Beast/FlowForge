<div align="center">

# ⚡ FlowForge

### Event-Driven Workflow Automation Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

**A production-grade, event-driven workflow automation engine with a visual workflow builder, distributed task queue, real-time monitoring, and comprehensive analytics.**

[Architecture](#architecture) · [Getting Started](#getting-started) · [Features](#features) · [API Documentation](#api-documentation) · [Contributing](#contributing)

</div>

---

## 🏗️ Architecture

FlowForge follows a **Feature-Based Modular Architecture** with clean separation of concerns, implementing the **Repository Pattern**, **Service Layer**, and **DTO Validation** across the entire stack.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React 19)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ Workflow  │ │Dashboard │ │Analytics │ │   Monitoring      │  │
│  │ Builder   │ │          │ │          │ │                   │  │
│  │(ReactFlow)│ │(Recharts)│ │(Recharts)│ │   (Live Updates)  │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          State: Zustand  │  Data: React Query            │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API + WebSocket (Socket.IO)
┌──────────────────────────▼──────────────────────────────────────┐
│                      SERVER (Express + TypeScript)               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Middleware Layer                       │    │
│  │  Auth │ RBAC │ Validation │ Rate Limit │ Request Logger  │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Module Layer                           │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │
│  │  │   Auth   │ │ Workflow │ │  Queue   │ │  Worker  │   │    │
│  │  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤   │    │
│  │  │Controller│ │Controller│ │Controller│ │Controller│   │    │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Service  │   │    │
│  │  │   Repo   │ │   Repo   │ │          │ │          │   │    │
│  │  │  Schema  │ │  Schema  │ │          │ │          │   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │
│  │  │Scheduler │ │Analytics │ │  Notify  │ │   Logs   │   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Service Layer                          │    │
│  │  Redis │ Logger │ Cache │ Email │ Event Emitter          │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────┬─────────────────────────────┬────────────────────────┘
           │                             │
┌──────────▼──────────┐      ┌───────────▼───────────┐
│    PostgreSQL 16    │      │       Redis 7         │
│  ┌──────────────┐   │      │  ┌────────────────┐   │
│  │    Users      │   │      │  │  BullMQ Queues │   │
│  │  Workflows    │   │      │  │  Job State     │   │
│  │  Executions   │   │      │  │  Session Cache │   │
│  │  Audit Logs   │   │      │  │  Rate Limits   │   │
│  │  Schedules    │   │      │  └────────────────┘   │
│  └──────────────┘   │      └───────────────────────┘
└─────────────────────┘
```

### System Design Highlights

| Concept | Implementation |
|---------|---------------|
| **Event-Driven Architecture** | BullMQ distributed task queue with Redis as message broker |
| **Workflow Engine** | DAG-based execution with conditional branching, delays, and webhooks |
| **Worker Pool** | BullMQ workers with concurrency control, retry with exponential backoff |
| **Dead Letter Queue** | Failed jobs automatically moved to DLQ after max retries |
| **Real-Time Updates** | Socket.IO for live workflow execution status and monitoring |
| **RBAC** | Role-based access control (Admin, Editor, Viewer) |
| **Repository Pattern** | Data access abstracted through repository interfaces |
| **Observability** | Structured logging (Winston), execution tracing, audit logs |

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication with access + refresh token rotation
- Role-Based Access Control (Admin, Editor, Viewer)
- Secure password hashing with bcrypt
- Rate-limited login endpoints

### 🔧 Visual Workflow Builder
- Drag-and-drop workflow designer powered by React Flow
- Node types: Trigger, Delay, Conditional, Notification, Webhook
- Real-time workflow validation
- Workflow versioning and status management

### ⚙️ Execution Engine
- Distributed job processing with BullMQ
- Configurable worker pool with concurrency control
- Automatic retry with exponential backoff
- Dead Letter Queue for permanently failed jobs
- Step-by-step execution tracing

### ⏰ Scheduler
- Cron-based recurring workflows
- Delayed job scheduling
- Repeat job patterns
- Scheduler health monitoring

### 📊 Analytics & Monitoring
- Real-time queue metrics (size, throughput, latency)
- Worker health monitoring
- Success/failure rate tracking
- Processing time percentiles
- Live dashboard with Socket.IO

### 📝 Comprehensive Logging
- Structured API request/response logs
- Worker execution logs
- Error tracking with stack traces
- Audit trail for all user actions

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.x
- **Docker** & **Docker Compose**
- **npm** >= 10.x

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/yourusername/flowforge.git
cd flowforge

# Copy environment variables
cp .env.example .env

# Start all services (PostgreSQL, Redis, Server, Client)
docker compose up -d

# Run database migrations
docker compose exec server npx prisma migrate deploy

# Access the application
# Frontend: http://localhost:3000
# Backend:  http://localhost:4000
# pgAdmin:  http://localhost:5050 (dev mode)
```

### Local Development

```bash
# Start infrastructure (PostgreSQL + Redis)
docker compose up postgres redis -d

# ─── Backend ───
cd server
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# ─── Frontend ───
cd client
cp .env.example .env
npm install
npm run dev
```

### Development with Full Docker Stack

```bash
# Start everything with dev tools (pgAdmin, Redis Commander)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# pgAdmin:          http://localhost:5050
# Redis Commander:  http://localhost:8081
# Frontend (Vite):  http://localhost:5173
# Backend:          http://localhost:4000
```

---

## 📁 Project Structure

```
flowforge/
├── server/                    # Backend (Express + TypeScript)
│   ├── prisma/                # Prisma schema & migrations
│   ├── src/
│   │   ├── config/            # Environment & service configuration
│   │   ├── database/          # Prisma client singleton
│   │   ├── middleware/        # Express middleware (auth, RBAC, validation, logging)
│   │   ├── shared/            # Shared types, errors, constants, interfaces
│   │   ├── modules/           # Feature modules (auth, workflow, queue, worker, etc.)
│   │   ├── services/          # Cross-cutting services (Redis, Logger, Cache)
│   │   ├── utils/             # Utility functions (crypto, JWT, helpers)
│   │   ├── events/            # Typed event emitter system
│   │   ├── websocket/         # Socket.IO server & handlers
│   │   ├── app.ts             # Express app configuration
│   │   └── server.ts          # HTTP server with graceful shutdown
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── client/                    # Frontend (React 19 + Vite)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route page components
│   │   ├── layouts/           # Layout components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API client & service layer
│   │   ├── context/           # React context providers
│   │   ├── store/             # Zustand state management
│   │   ├── charts/            # Recharts visualization components
│   │   ├── workflow/          # React Flow workflow builder
│   │   ├── dashboard/         # Dashboard widget components
│   │   ├── shared/            # Shared types, constants, utilities
│   │   ├── App.tsx            # Router setup
│   │   └── main.tsx           # Entry point with providers
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml         # Production compose
├── docker-compose.dev.yml     # Development overrides
├── .env.example               # Environment template
├── .gitignore
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/auth/register` | Register new user | ❌ |
| `POST` | `/api/v1/auth/login` | Login | ❌ |
| `POST` | `/api/v1/auth/refresh` | Refresh token | 🔑 |
| `GET` | `/api/v1/workflows` | List workflows | ✅ |
| `POST` | `/api/v1/workflows` | Create workflow | ✅ |
| `GET` | `/api/v1/workflows/:id` | Get workflow | ✅ |
| `PUT` | `/api/v1/workflows/:id` | Update workflow | ✅ |
| `DELETE` | `/api/v1/workflows/:id` | Delete workflow | ✅ |
| `POST` | `/api/v1/workflows/:id/trigger` | Trigger workflow | ✅ |
| `GET` | `/api/v1/workflows/:id/executions` | Execution history | ✅ |
| `GET` | `/api/v1/queue/status` | Queue metrics | ✅ Admin |
| `GET` | `/api/v1/queue/jobs/failed` | Failed jobs | ✅ Admin |
| `GET` | `/api/v1/workers/health` | Worker health | ✅ Admin |
| `GET` | `/api/v1/analytics/overview` | Analytics overview | ✅ |
| `GET` | `/api/v1/analytics/throughput` | Throughput metrics | ✅ |
| `GET` | `/api/v1/scheduler/jobs` | Scheduled jobs | ✅ |
| `POST` | `/api/v1/scheduler/jobs` | Create schedule | ✅ |
| `GET` | `/api/v1/logs` | System logs | ✅ Admin |
| `GET` | `/api/v1/logs/audit` | Audit logs | ✅ Admin |
| `GET` | `/api/v1/dashboard/metrics` | Dashboard data | ✅ |

---

## 🛡️ Design Patterns & Principles

- **Clean Architecture** — Separation of concerns across layers
- **SOLID Principles** — Single responsibility, open/closed, Liskov, interface segregation, dependency inversion
- **Repository Pattern** — Data access abstracted behind interfaces
- **Service Layer** — Business logic encapsulated in services
- **DTO Validation** — Request/response validation with Zod schemas
- **Event-Driven** — Loose coupling through event emitter and message queues
- **Dependency Injection** — Services injected rather than hard-coded
- **Circuit Breaker** — Graceful degradation for external service failures

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4 |
| State Management | Zustand, React Query |
| Workflow Builder | React Flow |
| Charts | Recharts |
| Animations | Framer Motion |
| Backend Framework | Express, TypeScript |
| Database | PostgreSQL 16, Prisma ORM |
| Cache & Queue | Redis 7, BullMQ |
| Authentication | JWT, bcrypt |
| Validation | Zod |
| Logging | Winston |
| Real-Time | Socket.IO |
| Containerization | Docker, Docker Compose |

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <strong>Built with ⚡ by FlowForge Team</strong>
</div>
