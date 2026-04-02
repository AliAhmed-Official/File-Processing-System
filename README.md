# Scalable Job Queue File Processing System

A MERN stack backend system for asynchronous CSV file processing using job queues.

## Architecture

- **API Server:** Express.js + TypeScript — handles file upload (presigned S3 URLs), job management, real-time updates (Socket.IO)
- **Worker:** BullMQ worker — streams CSV files from S3, validates rows, detects duplicates, saves results
- **Dashboard:** React + Vite + Tailwind — real-time job monitoring, upload, stats
- **Queue:** Redis + BullMQ — priority queue with retry, concurrency control
- **Database:** MongoDB Atlas — File, Job, Result collections with repository pattern
- **Storage:** Amazon S3 streaming upload/download

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- MongoDB Atlas account (free tier works)

### Setup

1. Clone and install:
   ```bash
   git clone <repo-url>
   cd file-processing-system
   npm install
   cd dashboard && npm install && cd ..
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env — set MONGO_URI to your Atlas connection string
   ```

3. Start infrastructure (Redis):
   ```bash
   docker compose up redis -d
   ```

4. Start API and Worker:
   ```bash
   npm run dev:api     # Terminal 1
   npm run dev:worker  # Terminal 2
   ```

5. Start Dashboard:
   ```bash
   cd dashboard
   npm run dev         # Terminal 3
   ```

6. Open http://localhost:5173

### Docker (Full Stack)

```bash
docker compose up --build
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/upload/presign | Get presigned S3 URL for upload |
| POST | /api/upload/confirm | Confirm upload and create processing job |
| POST | /api/upload/batch/presign | Batch presigned URLs |
| POST | /api/upload/batch/confirm | Batch confirm and create jobs |
| GET | /api/job/:id | Get job status and progress |
| GET | /api/job/:id/result | Get processing result |
| GET | /api/jobs | List jobs (paginated, filterable) |
| GET | /api/batch/:batchId | Get batch status |
| GET | /api/stats | Aggregate statistics |
| GET | /health | Health check |

## Design Decisions

- **Presigned URL uploads:** Client uploads directly to S3, API server never touches file bytes. Scales to 10,000+ concurrent uploads.
- **Streaming processing:** CSV files processed row-by-row via Node.js streams. Memory usage stays constant regardless of file size.
- **Hybrid duplicate detection:** SHA-256 hash set for files <50MB (exact), Bloom filter for larger files (memory-efficient, ~1% false positive).
- **Repository pattern:** Database-agnostic data access. Swap MongoDB for PostgreSQL by implementing new repository classes.
- **Redis caching:** Job status and stats cached with TTL. Cache invalidated on worker updates. Zero additional infrastructure.
- **Socket.IO real-time updates:** Live progress tracking, job completion/failure events, dashboard auto-refresh via Redis adapter for horizontal scaling.

## Scaling Strategy

- **API:** Stateless, add replicas behind load balancer
- **Workers:** Add replicas, BullMQ auto-distributes jobs
- **Socket.IO:** Redis adapter for cross-instance events
- **Redis:** Cluster mode or managed ElastiCache
- **MongoDB:** Atlas handles replication and scaling
- **S3:** Already infinitely scalable

## Project Structure

```
file-processing-system/
├── src/
│   ├── config/          # Environment, DB, Redis, S3 configuration
│   ├── controllers/     # Request handlers (upload, job)
│   ├── dtos/            # Data transfer objects
│   ├── interfaces/      # TypeScript interfaces
│   ├── middleware/       # Error handling, rate limiting, CORS, caching
│   ├── models/          # Mongoose schemas (File, Job, Result)
│   ├── processors/      # CSV processor, validator, duplicate detector
│   ├── repositories/    # Data access layer (repository pattern)
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic (storage, cache, queue, socket, job)
│   ├── types/           # Enums and shared types
│   ├── utils/           # Logger, ApiError, asyncHandler
│   ├── validators/      # Zod request validation schemas
│   ├── server.ts        # API entry point
│   └── worker.ts        # Worker entry point
├── dashboard/           # React frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── components/  # UI components (stats, jobs, upload, layout)
│   │   ├── hooks/       # React Query + Socket.IO hooks
│   │   ├── pages/       # Dashboard and job detail pages
│   │   ├── services/    # API client, socket singleton
│   │   └── types/       # Frontend type definitions
├── infra/               # S3 lifecycle rules
├── Dockerfile           # Multi-stage build (API + Worker targets)
├── docker-compose.yml   # Redis, LocalStack, API, Worker
└── docs/                # Design spec and implementation plan
```

## Assumptions & Limitations

- Only CSV file processing is supported (extensible to other formats)
- MongoDB Atlas is used externally (not in Docker Compose)
- Bloom filter has ~1% false positive rate for duplicate detection on large files
- Error details are capped at 100 per job to prevent memory issues
- S3 orphan cleanup relies on lifecycle rules (1-day expiry on unconfirmed uploads)
