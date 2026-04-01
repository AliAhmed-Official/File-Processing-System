# Scalable Job Queue Based File Processing System — Design Spec

## Overview

A MERN stack backend system that allows users to upload large CSV files and processes them asynchronously using a Redis-based job queue. Users upload files directly to S3 via presigned URLs, a BullMQ worker processes files in a streaming manner, and a React dashboard provides real-time monitoring.

## Core Workflow

1. Client requests a presigned S3 URL from the API
2. Client uploads file directly to S3 (multipart for large files)
3. Client confirms upload — API validates, creates File + Job documents, enqueues job
4. BullMQ worker picks job, streams file from S3, processes CSV row-by-row
5. Worker saves Result to database, updates job status
6. Dashboard shows real-time progress via Socket.IO

---

## 1. Project Structure & Tech Stack

### Directory Layout

```
file-processing-system/
├── src/
│   ├── server.ts                        # Express API entry point
│   ├── worker.ts                        # BullMQ worker entry point
│   ├── config/
│   │   ├── index.ts                     # Environment config (dotenv + Zod validation)
│   │   ├── db.ts                        # MongoDB Atlas connection
│   │   ├── redis.ts                     # Redis connection
│   │   └── s3.ts                        # AWS SDK S3Client configuration
│   ├── types/
│   │   ├── enums.ts                     # JobStatus, FileType, Priority, etc.
│   │   └── index.ts                     # Shared type exports
│   ├── interfaces/
│   │   ├── IJob.ts                      # Job document interface
│   │   ├── IFile.ts                     # File document interface
│   │   ├── IResult.ts                   # Result document interface
│   │   ├── IValidationRule.ts           # Configurable validation rule shape
│   │   ├── IProcessingReport.ts         # Summary report shape
│   │   ├── ICacheService.ts             # Cache operations interface
│   │   └── index.ts                     # Barrel export
│   ├── dtos/
│   │   ├── upload.dto.ts                # PresignRequestDTO, PresignResponseDTO, ConfirmUploadDTO, UploadResponseDTO
│   │   ├── job.dto.ts                   # JobStatusDTO, JobListDTO, JobDetailDTO
│   │   ├── result.dto.ts               # ProcessingResultDTO, SummaryReportDTO
│   │   └── validation.dto.ts            # ValidationRulesDTO
│   ├── models/
│   │   ├── Job.ts                       # Job Mongoose schema + model
│   │   ├── File.ts                      # File Mongoose schema + model
│   │   └── Result.ts                    # Result Mongoose schema + model
│   ├── repositories/
│   │   ├── interfaces/
│   │   │   ├── IJobRepository.ts        # findById, create, updateStatus, updateProgress, list, countByStatus
│   │   │   ├── IFileRepository.ts       # findById, create, delete
│   │   │   └── IResultRepository.ts     # findByJobId, create
│   │   ├── mongo/
│   │   │   ├── job.repository.ts        # Mongoose implementation
│   │   │   ├── file.repository.ts       # Mongoose implementation
│   │   │   └── result.repository.ts     # Mongoose implementation
│   │   └── index.ts                     # Barrel export + factory
│   ├── routes/
│   │   ├── upload.routes.ts             # POST /api/upload/presign, /confirm, /batch/*
│   │   ├── job.routes.ts                # GET /api/job/:id, /api/jobs, /api/job/:id/result
│   │   └── index.ts                     # Route aggregator
│   ├── controllers/
│   │   ├── upload.controller.ts
│   │   └── job.controller.ts
│   ├── services/
│   │   ├── queue.service.ts             # BullMQ queue setup, job creation, priority
│   │   ├── job.service.ts               # Job CRUD operations
│   │   ├── storage.service.ts           # S3 upload/download/delete with streaming
│   │   ├── socket.service.ts            # Socket.IO event emitter for progress
│   │   └── cache.service.ts             # Redis get/set/delete with TTL
│   ├── processors/
│   │   ├── csv.processor.ts             # Streaming CSV parser + row counting
│   │   ├── validator.ts                 # Row validation (structural + configurable rules)
│   │   ├── duplicateDetector.ts         # Hybrid hash/bloom filter
│   │   └── batch.processor.ts           # Batch file processing orchestrator
│   ├── middleware/
│   │   ├── upload.middleware.ts          # File validation
│   │   ├── error.middleware.ts           # Global error handler
│   │   ├── rateLimiter.middleware.ts     # express-rate-limit per endpoint
│   │   ├── sanitize.middleware.ts        # express-mongo-sanitize + xss-clean
│   │   ├── cors.middleware.ts            # CORS configuration
│   │   ├── helmet.middleware.ts          # Security headers
│   │   └── cache.middleware.ts           # Check Redis cache before hitting DB
│   ├── validators/
│   │   ├── upload.validator.ts          # Zod schema for upload requests
│   │   └── job.validator.ts             # Zod schema for job query params
│   └── utils/
│       ├── logger.ts                    # Winston structured logger
│       ├── ApiError.ts                  # Custom error class with status codes
│       └── asyncHandler.ts              # Express async wrapper
├── dashboard/                           # React + Vite + TypeScript
│   ├── src/
│   │   ├── types/
│   │   │   ├── job.types.ts
│   │   │   ├── result.types.ts
│   │   │   └── upload.types.ts
│   │   ├── interfaces/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Header.tsx
│   │   │   ├── stats/
│   │   │   │   ├── StatsCards.tsx
│   │   │   │   ├── StatusChart.tsx
│   │   │   │   └── ThroughputChart.tsx
│   │   │   ├── jobs/
│   │   │   │   ├── JobTable.tsx
│   │   │   │   ├── JobRow.tsx
│   │   │   │   ├── JobFilters.tsx
│   │   │   │   └── ProgressBar.tsx
│   │   │   ├── job-detail/
│   │   │   │   ├── JobInfo.tsx
│   │   │   │   ├── ResultSummary.tsx
│   │   │   │   ├── ErrorTable.tsx
│   │   │   │   └── RetryButton.tsx
│   │   │   ├── upload/
│   │   │   │   ├── UploadZone.tsx
│   │   │   │   ├── UploadProgress.tsx
│   │   │   │   ├── BatchUpload.tsx
│   │   │   │   └── ValidationRulesForm.tsx
│   │   │   └── common/
│   │   │       ├── StatusBadge.tsx
│   │   │       ├── Pagination.tsx
│   │   │       ├── LoadingSpinner.tsx
│   │   │       └── EmptyState.tsx
│   │   ├── hooks/
│   │   │   ├── useSocket.ts
│   │   │   ├── useJobs.ts
│   │   │   ├── useJobDetail.ts
│   │   │   ├── useStats.ts
│   │   │   └── useUpload.ts
│   │   ├── services/
│   │   │   ├── api.ts                   # Fetch wrapper (base URL, error handling)
│   │   │   └── socket.ts               # Socket.IO client singleton
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   └── JobDetailPage.tsx
│   │   └── App.tsx
│   └── package.json
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── tsconfig.json
├── package.json
└── README.md
```

### Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| Runtime | Node.js + TypeScript | Type-safe backend |
| API | Express.js | HTTP server |
| Queue | BullMQ | Redis-based job queue with priority, retry, concurrency |
| Database | MongoDB Atlas (Mongoose) | Document storage via cloud-managed cluster |
| File Storage | Amazon S3 (+ LocalStack for dev) | Streaming file upload/download |
| CSV Parsing | csv-parser | Stream-based row-by-row parsing |
| Duplicate Detection | Native Set + bloom-filters | Hybrid hash/bloom strategy |
| Real-time | Socket.IO + @socket.io/redis-adapter | Progress push to dashboard |
| Dashboard | React + Vite + TypeScript + Tailwind CSS | Monitoring UI |
| Data Fetching | TanStack React Query + native fetch | Server state management, caching, auto-refetch |
| Charts | Recharts | Lightweight React-native charts |
| Validation | Zod | Request DTO validation |
| Security | helmet, cors, express-rate-limit, express-mongo-sanitize, xss-clean | API hardening |
| Logging | Winston | Structured logging |
| Testing | Jest, ts-jest, Supertest | Unit + integration tests |
| Containerization | Docker + Docker Compose | One-command local setup |

---

## 2. Data Models & DTOs

### File Model

```typescript
{
  _id: ObjectId,
  originalName: string,          // "sales-data.csv"
  s3Key: string,                 // "uploads/confirmed/{jobId}/sales-data.csv"
  s3Bucket: string,
  mimeType: string,              // "text/csv"
  size: number,                  // bytes
  createdAt: Date,
  updatedAt: Date
}
```

### Job Model

```typescript
{
  _id: ObjectId,
  fileId: ObjectId,              // ref -> File
  status: JobStatus,             // pending | processing | completed | failed
  priority: number,              // 1 (low) - 10 (high), default 5
  progress: number,              // 0-100 percentage
  attempts: number,              // current retry count
  maxAttempts: number,           // 3
  validationRules: {
    requiredFields: string[],
    fieldTypes: Record<string, 'string' | 'number' | 'email' | 'date'>,
    customPatterns: Record<string, string>  // field -> regex
  } | null,
  batchId: string | null,        // groups batch uploads
  error: string | null,          // last error message
  startedAt: Date | null,
  completedAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```

### Result Model

```typescript
{
  _id: ObjectId,
  jobId: ObjectId,               // ref -> Job
  fileId: ObjectId,              // ref -> File
  totalRows: number,
  validRows: number,
  invalidRows: number,
  duplicateRows: number,
  duplicateStrategy: 'hash' | 'bloom',
  errorDetails: [                // capped at 100 samples
    { row: number, data: string, reason: string }
  ],
  summary: {
    processingTimeMs: number,
    fileSizeBytes: number,
    memoryStrategy: string,
    rowsPerSecond: number
  },
  createdAt: Date
}
```

### DTOs

| DTO | Fields | Used in |
|-----|--------|---------|
| PresignRequestDTO | filename, fileSize, mimeType, priority?, validationRules?, batchId? | POST /api/upload/presign request |
| PresignResponseDTO | presignedUrl, s3Key, expiresIn | Presign response |
| ConfirmUploadDTO | s3Key, originalName, fileSize | POST /api/upload/confirm request |
| UploadResponseDTO | jobId, fileId, status, message | Confirm response |
| JobStatusDTO | jobId, status, progress, priority, attempts, error, createdAt | GET /api/job/:id response |
| JobListDTO | jobs[], total, page, limit | GET /api/jobs response (paginated) |
| JobResultDTO | Full result + summary | GET /api/job/:id/result response |
| BatchStatusDTO | batchId, totalJobs, completed, failed, inProgress | GET /api/batch/:batchId response |

### Service Interfaces

```typescript
IStorageService      // upload, download (stream), delete, generatePresignedUrl
IQueueService        // addJob, addBatchJobs, getJob, removeJob
IJobService          // create, updateStatus, updateProgress, getById, list
IFileService         // create, getById, delete
IResultService       // create, getByJobId
ICsvProcessor        // process(readableStream, validationRules?) -> Result
IDuplicateDetector   // add(row), isDuplicate(row), getStats()
IValidator           // validateRow(row, rules?) -> { valid, reason? }
ICacheService        // get, set, delete, with TTL support
```

### Repository Interfaces

```typescript
IJobRepository       // findById, create, updateStatus, updateProgress, list, countByStatus
IFileRepository      // findById, create, delete
IResultRepository    // findByJobId, create
```

Services depend only on repository interfaces. Mongoose implementations live in `repositories/mongo/`. To swap databases, create new implementations and change the factory.

### MongoDB Indexes

```typescript
// Job collection
{ status: 1, createdAt: -1 }       // list jobs by status, recent first
{ batchId: 1 }                      // batch aggregation
{ status: 1, priority: -1 }         // priority ordering

// File collection
{ s3Key: 1 }                        // unique, lookup during confirm

// Result collection
{ jobId: 1 }                        // unique, lookup by job
```

---

## 3. API Endpoints & Flow

### Endpoints

| Method | Endpoint | Purpose | Rate Limit |
|--------|----------|---------|------------|
| POST | /api/upload/presign | Get presigned S3 URL | 10/min |
| POST | /api/upload/confirm | Confirm upload & create job | 10/min |
| POST | /api/upload/batch/presign | Get presigned URLs for multiple files | 5/min |
| POST | /api/upload/batch/confirm | Confirm batch upload & create jobs | 5/min |
| GET | /api/job/:id | Get job status & progress | 60/min |
| GET | /api/job/:id/result | Get processing result | 30/min |
| GET | /api/jobs | List jobs (paginated, filterable) | 30/min |
| GET | /api/batch/:batchId | Get batch status overview | 30/min |
| GET | /api/stats | Aggregate stats for dashboard | 30/min |
| GET | /health | Health check (Redis + Mongo + S3) | No limit |

### Security Layers

| Layer | Tool | Purpose |
|-------|------|---------|
| Security headers | helmet | XSS protection, content-type sniffing, HSTS |
| Rate limiting | express-rate-limit | Per-endpoint abuse prevention |
| CORS | cors | Whitelist dashboard origin only |
| Input sanitization | express-mongo-sanitize + xss-clean | Prevent NoSQL injection and XSS |
| File validation | Custom middleware | CSV only, max size, filename sanitization |
| Request validation | Zod | Validate DTOs at route boundaries |
| Error masking | Custom error middleware | Never leak stack traces in production |
| Logging | Winston | Structured logs, no sensitive data |

### Single File Upload Flow

```
Client                          API Server                      S3                    Redis/BullMQ          Worker                MongoDB
  |                                |                            |                        |                    |                     |
  |-- POST /upload/presign ------->|                            |                        |                    |                     |
  |  {filename, size, mimeType}    |                            |                        |                    |                     |
  |                                |-- Validate (Zod)           |                        |                    |                     |
  |                                |-- Generate presigned URL   |                        |                    |                     |
  |                                |   (prefix: unconfirmed/)   |                        |                    |                     |
  |                                |   (multipart for >10MB)    |                        |                    |                     |
  |<-- {presignedUrl, s3Key} ------|                            |                        |                    |                     |
  |                                |                            |                        |                    |                     |
  |-- Upload parts (parallel) ------------------------------------>|                     |                    |                     |
  |-- CompleteMultipartUpload ------------------------------------>|                     |                    |                     |
  |<-- 200 OK ----------------------------------------------------|                     |                    |                     |
  |                                |                            |                        |                    |                     |
  |-- POST /upload/confirm ------->|                            |                        |                    |                     |
  |  {s3Key, originalName, size}   |                            |                        |                    |                     |
  |                                |-- HeadObject (exists?) --->|                        |                    |                     |
  |                                |-- Verify size match        |                        |                    |                     |
  |                                |-- Move to confirmed/ prefix|                        |                    |                     |
  |                                |-- Create File doc ------------------------------------------------------------------>|
  |                                |-- Create Job doc (pending) -------------------------------------------------------------->|
  |                                |-- Enqueue job ------------------------------------------->|              |                     |
  |<-- {jobId, fileId, status} ----|                            |                        |                    |                     |
  |                                |                            |                        |-- Dispatch ------->|                     |
  |                                |                            |                        |                    |-- Update: processing>|
  |                                |                            |<-- Stream file ----------------------------|                     |
  |                                |                            |                        |                    |-- csv-parser rows    |
  |                                |                            |                        |                    |-- validate each row  |
  |                                |                            |                        |                    |-- check duplicates   |
  |                                |                            |                        |<-- progress 40% --|                     |
  |<-- Socket.IO progress --------------------------------------------------------------------------------------|                     |
  |                                |                            |                        |                    |-- Save Result ------>|
  |                                |                            |                        |                    |-- Update: completed->|
  |<-- Socket.IO complete --------------------------------------------------------------------------------------|                     |
```

### Batch Upload Flow

```
Client                          API Server
  |                                |
  |-- POST /upload/batch/presign ->|  {files: [{filename, size, mimeType}, ...]}
  |<-- {files: [{presignedUrl, s3Key}, ...], batchId} --|
  |                                |
  |-- PUT each file to S3 (parallel)
  |                                |
  |-- POST /upload/batch/confirm ->|  {batchId, files: [{s3Key, originalName, size}, ...]}
  |                                |-- Verify all objects exist in S3
  |                                |-- Create File docs (bulk insert)
  |                                |-- Create Job docs (bulk insert, linked to batchId)
  |                                |-- Enqueue all jobs
  |<-- {batchId, jobs: [{jobId, fileId}, ...]} --|
```

### S3 Upload Failure Handling

**Client-side retry:** Failed uploads retry with the same presigned URL (valid 15 min). For large files, S3 multipart upload retries only the failed chunk.

**Orphan cleanup via S3 key prefixes:**

- `POST /presign` generates key with `uploads/unconfirmed/{tempId}/` prefix
- `POST /confirm` moves object to `uploads/confirmed/{jobId}/` prefix
- S3 lifecycle rule auto-deletes objects in `unconfirmed/` after 24 hours
- S3 lifecycle rule auto-deletes incomplete multipart uploads after 24 hours

**Confirm validation:**

1. Check S3 object exists at s3Key (404 if not)
2. Check object size matches declared size (400 if mismatch — partial upload)
3. Check content-type is text/csv (400 if wrong)
4. Only then: create documents and enqueue

### Request Validation (Zod)

```typescript
// POST /upload/presign
PresignRequestSchema = z.object({
  filename: z.string().min(1).max(255).regex(/\.csv$/i),
  fileSize: z.number().positive().max(500 * 1024 * 1024),  // 500MB cap
  mimeType: z.literal('text/csv'),
  priority: z.number().min(1).max(10).optional().default(5),
  validationRules: ValidationRulesSchema.optional(),
  batchId: z.string().uuid().optional()
});

// POST /upload/confirm
ConfirmUploadSchema = z.object({
  s3Key: z.string().min(1),
  originalName: z.string().min(1).max(255),
  fileSize: z.number().positive()
});
```

### Error Response Shape

```typescript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR" | "NOT_FOUND" | "RATE_LIMITED" | "S3_ERROR" | "INTERNAL_ERROR",
    message: "Human-readable description",
    details?: any  // validation errors in dev, omitted in production
  }
}
```

---

## 4. Worker Processing Pipeline

### Worker Flow

```
worker.ts entry point
  |
  |-- Connect to Redis, MongoDB
  |-- Register BullMQ Worker with concurrency setting
  |
  |-- On job received:
  |     |-- Update job status -> processing
  |     |-- Fetch file metadata from DB (s3Key, size)
  |     |-- Select duplicate strategy (hash for <50MB, bloom for >=50MB)
  |     |-- Stream file from S3 (GetObjectCommand -> ReadableStream)
  |     |-- Pipe to csv-parser (row-by-row)
  |     |     |-- Row 1 (header): extract columns, init validator
  |     |     |-- Row N: validate -> check duplicate -> increment counters
  |     |     |-- Every 1000 rows: report progress via job.updateProgress() + Socket.IO
  |     |     |-- Stream ends: calculate stats, save Result, update job -> completed
  |     |
  |     |-- On error: BullMQ auto-retries with exponential backoff
  |           |-- After max retries: job -> failed, emit Socket.IO event
```

### Streaming Pipeline (Memory Safe)

The worker never holds more than one CSV row in memory at a time. The S3 response stream pipes directly into csv-parser which emits row objects one at a time.

### Duplicate Detection (Hybrid Strategy)

| File Size | Strategy | Memory Usage | Accuracy |
|-----------|----------|-------------|----------|
| < 50MB (~500K rows) | SHA-256 hash per row in Set | ~16MB | Exact (zero false positives) |
| >= 50MB | Bloom filter | ~1-2MB | ~1% false positive rate, zero false negatives |

Both implement IDuplicateDetector interface. The processor selects strategy based on file size from the File document. Threshold is configurable via environment variable.

### Row Validation

**Structural (always runs):**
- Column count matches header count
- No completely empty rows
- Malformed CSV handled by csv-parser error events

**Configurable (if rules provided at upload):**
- Required fields: reject if empty
- Type checks: string, number, email, date
- Custom regex patterns: field value must match pattern

### Progress Tracking

Progress = bytesProcessed / totalFileSize * 100. Reported every 1000 rows via:
1. BullMQ `job.updateProgress()` — persisted, queryable via `GET /job/:id`
2. Socket.IO emit — real-time push to dashboard

### Retry & Backoff

```typescript
{
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 }  // 5s -> 10s -> 20s
}
```

| Attempt | Delay | Outcome if fails |
|---------|-------|-----------------|
| 1st try | 0 | Retry scheduled |
| 1st retry | 5s | Retry scheduled |
| 2nd retry | 10s | Retry scheduled |
| 3rd retry | 20s | Job marked failed permanently |

### Concurrency Control

```typescript
const worker = new Worker('file-processing', processor, {
  concurrency: 3,           // 3 jobs per worker instance
  limiter: { max: 10, duration: 60_000 }  // 10 jobs/min global rate limit
});
```

### Priority Queue

Priority 1-10 (higher = processed first). Default: 5. Batch jobs default to priority 3 to avoid blocking individual uploads.

### Worker Failure Scenarios

| Failure | Detection | Recovery |
|---------|-----------|----------|
| S3 stream breaks | Stream error event | BullMQ retries with backoff |
| MongoDB write fails | Catch in end handler | Retry — reprocesses from start |
| Worker process crashes | BullMQ stalled job detection (30s timeout) | Job re-enters queue |
| Invalid CSV | csv-parser error event | Mark failed, no retry (user error) |
| Redis connection lost | BullMQ connection error | Auto-reconnect, stalled jobs retry |

---

## 5. Redis Caching Strategy

Redis is already in the stack for BullMQ. Caching adds zero infrastructure cost.

### Cached Endpoints

| Endpoint | Cache Key | TTL | Invalidation |
|----------|-----------|-----|-------------|
| GET /api/job/:id | job:{id} | pending: 5s, processing: 3s, completed/failed: 60s | Worker status update deletes key |
| GET /api/job/:id/result | result:{jobId} | 5 min | Write-through: cached immediately when worker saves result |
| GET /api/stats | stats:dashboard | 10s | Deleted when any job completes or fails |
| GET /api/jobs (page 1) | jobs:list:page1 | 5s | Deleted on any job status change |

### Cache Flow

```
Request -> cache.middleware -> check Redis
  |-- Hit: return cached response
  |-- Miss: controller -> service -> repository -> MongoDB
              |-- cache response in Redis with appropriate TTL
              |-- return response
```

### Cache Invalidation

Worker updates trigger cache invalidation:
- Job status change: delete `job:{id}`, delete `jobs:list:page1`, delete `stats:dashboard`
- Result saved: write-through cache `result:{jobId}`

---

## 6. React Dashboard

### Pages

**DashboardPage** — overview with stats cards (total jobs, success rate, avg processing time, active workers), status distribution chart, throughput chart, paginated job list with filters.

**JobDetailPage** — single job view with status, timestamps, progress bar, retry button (for failed jobs), and result summary with error samples table.

### Components

```
layout/      Sidebar, Header (with connection status indicator)
stats/       StatsCards, StatusChart (pie/donut), ThroughputChart (line)
jobs/        JobTable, JobRow, JobFilters, ProgressBar
job-detail/  JobInfo, ResultSummary, ErrorTable, RetryButton
upload/      UploadZone (drag & drop), UploadProgress, BatchUpload, ValidationRulesForm
common/      StatusBadge, Pagination, LoadingSpinner, EmptyState
```

### Real-time via Socket.IO

```
Socket.IO events:
  job:progress   -> { jobId, progress }
  job:completed  -> { jobId, resultId }
  job:failed     -> { jobId, error, attempt }
  batch:update   -> { batchId, completed, total }
  stats:update   -> { totalJobs, successRate, ... }

Socket.IO rooms:
  'dashboard'       -> receives stats:update events
  'job:{jobId}'     -> receives job-specific events
  'batch:{batchId}' -> receives batch-level events
```

Dashboard joins rooms on page navigation, leaves on unmount.

### Upload Flow in Dashboard

1. User drops file(s) in UploadZone
2. Validates: CSV? Under 500MB?
3. Optional: fill ValidationRulesForm
4. useUpload hook: presign -> split into 5MB chunks -> upload parallel (max 4 concurrent) -> complete multipart -> confirm -> join socket room
5. Failed chunks auto-retry (max 3)

### State Management

TanStack React Query + context (no Redux). QueryClient provides caching, refetching, and loading/error states. SocketContext provides socket instance. Data fetching: React Query with native fetch for initial + polling, Socket.IO events invalidate queries for real-time updates, React Query's built-in refetchInterval as fallback if socket disconnects.

### Tech Stack (Dashboard)

React 18, Vite, TypeScript, React Router v6, TanStack React Query, Socket.IO Client, Recharts, Tailwind CSS. API calls use native fetch via a thin wrapper — no axios.

---

## 7. Docker & Infrastructure

### Docker Compose

```yaml
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: [redis-data:/data]

  localstack:
    image: localstack/localstack
    ports: ["4566:4566"]
    environment:
      - SERVICES=s3
      - DEFAULT_REGION=us-east-1

  api:
    build: { context: ., dockerfile: Dockerfile, target: api }
    ports: ["3000:3000"]
    depends_on: [redis, localstack]
    environment:
      - NODE_ENV=development
      - MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/file-processor
      - REDIS_HOST=redis
      - S3_ENDPOINT=http://localstack:4566
      - S3_BUCKET=file-uploads
    deploy:
      replicas: 2

  worker:
    build: { context: ., dockerfile: Dockerfile, target: worker }
    depends_on: [redis, localstack]
    environment:
      - NODE_ENV=development
      - MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/file-processor
      - REDIS_HOST=redis
      - S3_ENDPOINT=http://localstack:4566
      - S3_BUCKET=file-uploads
    deploy:
      replicas: 3

  dashboard:
    build: { context: ./dashboard, dockerfile: Dockerfile }
    ports: ["5173:5173"]
    depends_on: [api]

  s3-init:
    image: amazon/aws-cli
    depends_on: [localstack]
    entrypoint: >
      sh -c "aws --endpoint-url=http://localstack:4566 s3 mb s3://file-uploads
             && aws --endpoint-url=http://localstack:4566 s3api put-bucket-lifecycle-configuration
             --bucket file-uploads --lifecycle-configuration file:///lifecycle.json"
    volumes: [./infra/s3-lifecycle.json:/lifecycle.json]

volumes:
  redis-data:
```

MongoDB is NOT in Docker — uses Atlas connection string via MONGO_URI environment variable.

### Multi-stage Dockerfile

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src/ ./src/

FROM base AS build
RUN npm run build

FROM node:20-alpine AS api
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
CMD ["node", "dist/server.js"]

FROM node:20-alpine AS worker
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
CMD ["node", "dist/worker.js"]
```

### Horizontal Scaling Strategy

```
                 Load Balancer (Nginx, sticky sessions for Socket.IO)
                    |          |          |
                 API #1     API #2     API #3
                    |          |          |
                 Redis (BullMQ queue + Socket.IO adapter + cache)
                    |          |
              Worker #1   Worker #2   Worker #N
                    |          |          |
                 MongoDB Atlas (managed, auto-scaling)
```

**Scaling each component:**

| Component | Strategy |
|-----------|----------|
| API | Stateless — add replicas behind load balancer |
| Workers | Add replicas — BullMQ auto-distributes jobs |
| Socket.IO | @socket.io/redis-adapter for cross-instance event delivery |
| Redis | Redis Cluster or managed ElastiCache for production |
| MongoDB | Atlas handles replication, scaling, backups |
| S3 | Already infinite scale |

### Interview Answer Reference

| Question | Answer |
|----------|--------|
| 10,000 concurrent jobs? | Presigned URLs bypass API for uploads. BullMQ distributes across N workers. Add worker replicas. Redis handles queue state. |
| Redis goes down? | BullMQ auto-reconnects. Stalled jobs re-enter queue on recovery. Production: Redis Sentinel or ElastiCache with failover. MongoDB is source of truth — queue is reconstructable. |
| How to scale? | API: replicas + LB. Workers: replicas. Redis: cluster. MongoDB: Atlas auto-scaling. S3: already infinite. Everything stateless. |
| Where can it fail? | S3 upload (mitigated: multipart + retry). Worker crash (mitigated: stall detection + retry). Redis crash (mitigated: Sentinel + MongoDB truth). Bloom filter false positives (documented trade-off). |

---

## 8. Testing Strategy

### Test Structure

```
src/__tests__/
├── unit/
│   ├── processors/
│   │   ├── csv.processor.test.ts
│   │   ├── validator.test.ts
│   │   └── duplicateDetector.test.ts
│   ├── services/
│   │   ├── queue.service.test.ts
│   │   └── job.service.test.ts
│   └── utils/
│       └── ApiError.test.ts
├── integration/
│   ├── repositories/
│   │   ├── job.repository.test.ts
│   │   ├── file.repository.test.ts
│   │   └── result.repository.test.ts
│   ├── routes/
│   │   ├── upload.routes.test.ts
│   │   └── job.routes.test.ts
│   └── worker/
│       └── worker.pipeline.test.ts
└── helpers/
    ├── fixtures/                    # Sample CSVs
    ├── mockS3Stream.ts
    └── dbSetup.ts
```

### Test Cases (~18 total)

**Unit: CSV Processor (4)**
- Parses valid CSV with correct row counts
- Counts invalid rows on column mismatch
- Handles empty file (0 rows, no crash)
- Processes stream without loading into memory

**Unit: Validator (3)**
- Structural: catches wrong column count
- Configurable: rejects type mismatches
- Custom regex patterns validate correctly

**Unit: Duplicate Detector (3)**
- Hash detector catches exact duplicates
- Bloom detector catches duplicates with expected false-positive rate
- Hybrid switches strategy at file size threshold

**Integration: Repositories (3)**
- Job: create -> findById -> updateStatus -> verify
- File: create -> findById -> verify fields
- Result: create -> findByJobId -> verify counts

**Integration: Routes (3)**
- Presign returns valid presigned URL and s3Key
- Confirm with valid s3Key creates File + Job + enqueues
- Confirm with non-existent s3Key returns 404

**Integration: Worker Pipeline (2)**
- Full pipeline: mock S3 stream -> process -> Result saved with correct counts
- Malformed CSV triggers error, job marked failed

### Tools

Jest + ts-jest (runner), Supertest (HTTP integration), Readable.from() (mock streams).

### Test DB

Separate `file-processor-test` database on Atlas. dbSetup.ts connects before all tests, drops collections after each suite, disconnects after all.

### Intentionally Skipped

Dashboard tests, E2E tests, middleware unit tests, Socket.IO tests — low value relative to effort for an assignment.

---

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# MongoDB Atlas
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/file-processor

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_BUCKET=file-uploads
S3_ENDPOINT=http://localhost:4566   # LocalStack for dev, omit for production

# BullMQ
QUEUE_CONCURRENCY=3
QUEUE_MAX_RETRIES=3
QUEUE_RATE_LIMIT_MAX=10
QUEUE_RATE_LIMIT_DURATION=60000

# Duplicate Detection
DUPLICATE_HASH_THRESHOLD_BYTES=52428800  # 50MB — files below use hash, above use bloom

# Socket.IO
SOCKET_CORS_ORIGIN=http://localhost:5173
```
