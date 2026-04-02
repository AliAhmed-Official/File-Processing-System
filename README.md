# Scalable Job Queue File Processing System

A full-stack system for asynchronous CSV file processing using job queues. Two separate Node.js processes (API server + BullMQ worker) communicate via Redis, with MongoDB for persistence and S3 for file storage. A React dashboard provides real-time monitoring.

## Architecture

```
┌─────────────┐    presigned URL    ┌──────┐
│   Client /  │ ──────────────────► │  S3  │
│  Dashboard  │                     └──┬───┘
└──────┬──────┘                        │
       │ REST + Socket.IO              │ stream
       ▼                               ▼
┌─────────────┐    BullMQ job    ┌──────────┐
│  API Server │ ───────────────► │  Worker  │
│  (Express)  │     Redis        │ (BullMQ) │
└──────┬──────┘                  └────┬─────┘
       │                              │
       └──────────┬───────────────────┘
                  ▼
             ┌─────────┐
             │ MongoDB │
             └─────────┘
```

- **API Server** (`src/server.ts`) — Express 5 + TypeScript. Handles uploads via presigned S3 URLs (never touches file bytes), enqueues jobs to BullMQ, serves job status via REST + Socket.IO real-time updates.
- **Worker** (`src/worker.ts`) — BullMQ worker. Pulls jobs from the `file-processing` queue, streams CSVs from S3, validates rows, detects duplicates, writes results to MongoDB.
- **Dashboard** (`dashboard/`) — React 19 + Vite + Tailwind CSS 4. Real-time job monitoring, file upload, and stats visualization with Recharts. Served via Nginx in production.
- **Queue** — Redis + BullMQ with priority support, configurable concurrency and rate limiting.
- **Database** — MongoDB with repository pattern (File, Job, Result collections).
- **Storage** — Amazon S3 with presigned URLs for direct client uploads.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API | Express 5, TypeScript, Zod validation |
| Worker | BullMQ, csv-parser (streaming) |
| Real-time | Socket.IO with Redis adapter |
| Database | MongoDB (Mongoose 9) |
| Cache/Queue | Redis 7 (ioredis) |
| Storage | AWS S3 (@aws-sdk/client-s3) |
| Frontend | React 19, Vite 8, Tailwind CSS 4, TanStack React Query, Recharts |
| Security | Helmet, CORS, express-rate-limit |
| Testing | Jest 30, Supertest |
| Infrastructure | Docker, Docker Compose, Nginx |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- MongoDB instance (Atlas free tier or local)

### Setup

1. Clone and install dependencies:
   ```bash
   git clone <repo-url>
   cd file-processing-system
   npm install
   cd dashboard && npm install && cd ..
   ```

2. Create a `.env` file in the project root with the required variables:
   ```env
   MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/file-processing
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=test
   AWS_SECRET_ACCESS_KEY=test
   S3_BUCKET=file-uploads
   ```

   See [`src/config/index.ts`](src/config/index.ts) for all available environment variables and their defaults.

3. Start Redis:
   ```bash
   docker compose up redis -d
   ```

4. Start API and Worker (separate terminals):
   ```bash
   npm run dev:api     # Terminal 1 — API on port 3000
   npm run dev:worker  # Terminal 2 — Worker process
   ```

5. Start Dashboard:
   ```bash
   cd dashboard
   npm run dev         # Terminal 3 — Dashboard on port 5173
   ```

6. Open http://localhost:5173

### Docker (Full Stack)

```bash
docker compose up --build
```

This starts Redis, API server (port 3000), worker, and dashboard (port 5173 via Nginx). MongoDB must be provided externally via `MONGO_URI` in `.env`.

## API Endpoints

All endpoints are prefixed with `/api`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/presign` | Get presigned S3 URL for upload |
| POST | `/api/upload/confirm` | Confirm upload and create processing job |
| POST | `/api/upload/batch/presign` | Batch presigned URLs |
| POST | `/api/upload/batch/confirm` | Batch confirm and create jobs |
| GET | `/api/job/:id` | Get job status and progress |
| GET | `/api/job/:id/result` | Get processing result |
| GET | `/api/jobs` | List jobs (paginated, filterable) |
| GET | `/api/stats` | Aggregate statistics |

### Real-time Events (Socket.IO)

The API server broadcasts job progress and completion events via Socket.IO. The worker uses `@socket.io/redis-emitter` to emit events through Redis pub/sub without running its own Socket.IO server.

## Testing

```bash
npm test                                     # All tests (sequential)
npm run test:unit                            # Unit tests only
npm run test:integration                     # Integration tests (requires MongoDB)
npx jest --testPathPatterns=validator         # Single test file
```

**Unit tests** cover CSV processing, row validation, and duplicate detection. **Integration tests** cover MongoDB repository operations and require a running MongoDB instance.

## Design Decisions

- **Presigned URL uploads** — Client uploads directly to S3; the API server never touches file bytes. Scales to 10,000+ concurrent uploads.
- **Streaming CSV processing** — Files processed row-by-row via Node.js streams. Memory usage stays constant regardless of file size.
- **Hybrid duplicate detection** — SHA-256 hash set for files <50MB (exact), Bloom filter for larger files (memory-efficient, ~1% false positive rate). Threshold configurable via `DUPLICATE_HASH_THRESHOLD_BYTES`.
- **Repository pattern** — Database-agnostic data access layer. Swap MongoDB for another database by implementing new repository classes.
- **Redis caching** — Job status and stats cached with TTL, invalidated on worker updates.
- **Two-process architecture** — API and worker scale independently. Add worker replicas for throughput; add API replicas behind a load balancer for request capacity.

## Scaling Strategy

| Component | How to Scale |
|-----------|-------------|
| API | Stateless — add replicas behind a load balancer |
| Workers | Add replicas; BullMQ auto-distributes jobs |
| Socket.IO | Redis adapter enables cross-instance event broadcasting |
| Redis | Cluster mode or managed service (e.g., ElastiCache) |
| MongoDB | Atlas handles replication and sharding |
| S3 | Inherently scalable |

## Project Structure

```
file-processing-system/
├── src/
│   ├── config/          # Environment validation (Zod), DB, Redis, S3 config
│   ├── controllers/     # Request handlers (upload, job)
│   ├── dtos/            # Data transfer objects
│   ├── interfaces/      # TypeScript interfaces
│   ├── middleware/       # Error handling, rate limiting, CORS, caching
│   ├── models/          # Mongoose schemas (File, Job, Result)
│   ├── processors/      # CSV processor, row validator, duplicate detector
│   ├── repositories/    # Data access layer (repository pattern)
│   │   └── mongo/       # MongoDB implementations
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic (storage, cache, queue, socket, job)
│   ├── types/           # Enums and shared types
│   ├── utils/           # Logger, ApiError, asyncHandler
│   ├── validators/      # Zod request validation schemas
│   ├── __tests__/       # Test suites
│   │   ├── unit/        # Unit tests (processors)
│   │   ├── integration/ # Integration tests (repositories)
│   │   └── helpers/     # Test utilities (DB setup)
│   ├── server.ts        # API entry point
│   └── worker.ts        # Worker entry point
├── dashboard/           # React frontend
│   ├── src/
│   │   ├── components/  # UI components (stats, jobs, upload, layout)
│   │   ├── hooks/       # React Query + Socket.IO hooks
│   │   ├── pages/       # Dashboard and job detail pages
│   │   ├── services/    # API client, socket singleton
│   │   └── types/       # Frontend type definitions
│   ├── Dockerfile       # Multi-stage build (Node + Nginx)
│   └── nginx.conf       # Nginx configuration for production
├── infra/               # S3 lifecycle rules (JSON)
├── Dockerfile           # Multi-stage build (API + Worker targets)
├── docker-compose.yml   # Redis, API, Worker, Dashboard
└── jest.config.ts       # Jest configuration with path aliases
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGO_URI` | Yes | — | MongoDB connection string |
| `AWS_REGION` | Yes | — | AWS region for S3 |
| `AWS_ACCESS_KEY_ID` | Yes | — | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Yes | — | AWS secret key |
| `S3_BUCKET` | Yes | — | S3 bucket name |
| `PORT` | No | `3000` | API server port |
| `REDIS_HOST` | No | `localhost` | Redis hostname |
| `REDIS_PORT` | No | `6379` | Redis port |
| `QUEUE_CONCURRENCY` | No | `3` | Worker concurrency |
| `QUEUE_MAX_RETRIES` | No | `3` | Max job retry attempts |
| `QUEUE_RATE_LIMIT_MAX` | No | `10` | Queue rate limit (max jobs) |
| `QUEUE_RATE_LIMIT_DURATION` | No | `60000` | Queue rate limit window (ms) |
| `DUPLICATE_HASH_THRESHOLD_BYTES` | No | `52428800` | Hash vs Bloom filter threshold (50MB) |
| `SOCKET_CORS_ORIGIN` | No | `http://localhost:5173` | Allowed Socket.IO origin |

## Assumptions & Limitations

- Only CSV file processing is supported (extensible to other formats)
- MongoDB is provided externally (not included in Docker Compose)
- Bloom filter has ~1% false positive rate for duplicate detection on large files
- Error details are capped at 100 per job to prevent memory issues
- S3 orphan cleanup relies on lifecycle rules (1-day expiry on unconfirmed uploads)