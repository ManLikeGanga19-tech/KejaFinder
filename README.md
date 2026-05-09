# KejaFinder

Kenyan real estate platform — mobile app + marketing website + Fastify API.

Freemium model: users browse listings free, pay KES 499 via M-Pesa to unlock agent contacts and exact addresses. Agents pay subscriptions to list properties and receive leads.

## Stack

| Layer | Tech |
|-------|------|
| Mobile | React Native + Expo Router |
| API | Fastify + TypeBox + postgres.js (raw SQL) |
| Database | PostgreSQL 16 + PostGIS |
| Cache / Queue | Redis + BullMQ |
| Auth | Firebase Auth (phone OTP +254) |
| Payments | M-Pesa Daraja STK Push |
| Push | Firebase Cloud Messaging |
| Media | Cloudinary (listing photos) + Firebase Storage (avatars/KYC) |
| Hosting | Firebase App Hosting + Cloud SQL |

## Repo layout

```
kejafinder/
├── api/                  Fastify API server
│   ├── src/
│   │   ├── lib/          Pure utilities (phone, idempotency, lock-unlock, mpesa)
│   │   ├── plugins/      Fastify plugins (db, redis, firebase-auth, swagger)
│   │   └── modules/      Domain routers (auth, users, listings, areas, payments, agents, media, notifications, admin)
│   ├── db/migrations/    Raw SQL migration files
│   ├── scripts/          migrate.ts, dump-openapi.ts
│   └── test/             Vitest unit + integration tests
├── apps/mobile/          React Native + Expo
│   ├── app/              Expo Router screens
│   ├── src/              Components, theme, lib
│   └── test/             Jest + RNTL tests
├── docs/openapi/         Split OpenAPI 3.1 specification
├── postman/              Postman collection + environments
└── package.json          npm workspaces root
```

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

```bash
# Local Postgres + PostGIS via Docker
docker run -d --name keja-pg -e POSTGRES_PASSWORD=keja2024 -e POSTGRES_USER=keja -e POSTGRES_DB=kejafinder_dev -p 5432:5432 postgis/postgis:16-3.4-alpine

# Copy env and run migrations
cp api/.env.example api/.env
# Edit api/.env with your DATABASE_URL
cd api && npx tsx scripts/migrate.ts
```

### 3. Start the API

```bash
npm run dev:api
# Server: http://localhost:3001
# Docs:   http://localhost:3001/docs
```

### 4. Start the mobile app

```bash
cd apps/mobile

# Download fonts on first run
bash scripts/download-fonts.sh

npx expo start
# Press 'a' for Android emulator
```

## Testing

```bash
# All API unit tests (no Docker required)
npm run test:api:unit

# API integration tests (requires Docker)
npm run test:api:integration

# Mobile component tests
npm run test:mobile

# Everything
npm test
```

## Lock/unlock invariant

`api/src/lib/lock-unlock.ts` is the **only** code that decides what fields to return. The `containsSensitiveFields()` test invariant proves no leaked fields. Sensitive fields (`address`, `coordinates`, `caretakerName`, `caretakerPhone`, `descriptionFull`) are stripped from locked-view responses. See `api/test/unit/lock-unlock.test.ts`.

## M-Pesa idempotency

Clients generate a UUID v4 idempotency key before calling `/payments/initiate`. The DB-level UNIQUE constraint on `payments.idempotency_key` prevents double STK Push on network retry. See `api/test/integration/payments-idempotency.test.ts`.

## License

UNLICENSED — proprietary.
