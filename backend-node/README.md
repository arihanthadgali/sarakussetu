# SarakuSetu Node backend

This directory is an isolated Node.js and TypeScript backend scaffold for the incremental migration from `../backend`. The Spring Boot service, its Flyway migrations, and the existing database are intentionally untouched.

## Prerequisites

- Node.js 22 or newer

## Commands

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```

Copy `.env.example` to `.env` to override local runtime settings. Never commit the resulting `.env` file.

## Database

Prisma now maps the PostgreSQL translation of the Flyway-managed schema.
The original MySQL V1–V15 migrations remain unchanged in
`../backend/src/main/resources/db/migration`; the PostgreSQL versions live in
`db/postgresql/migration`. Flyway remains the only migration owner.

See [PostgreSQL setup and migration notes](db/postgresql/README.md) for local database
creation, Flyway commands, compatibility differences, test limitations and the
preserved `prisma/schema.mysql.prisma` mapping. This prepares a fresh PostgreSQL
schema; it does not copy existing MySQL data or deploy/cut over production.

Set a PostgreSQL `DATABASE_URL` using `.env.example` (the existing `.env` is not
modified automatically). Generate the matching client before building:

```bash
npx prisma validate --schema prisma/schema.prisma
npx prisma generate --schema prisma/schema.prisma
```

Do **not** run `prisma migrate`, `prisma db push`, `prisma db seed`, or reset commands.
`src/database/prisma.ts` and the `SELECT 1` health probe are provider-independent
and need no code changes. No migrations run on Node startup.

## OTP authentication and JWT signing

`POST /api/auth/otp/request` and `POST /api/auth/otp/verify` reuse the Flyway-managed `customers` and `otp_verifications` tables. OTPs are cryptographically generated, BCrypt-hashed, valid for five minutes, and limited to five verification attempts. In development the delivery adapter logs the OTP, matching the existing Spring development behavior; it is a no-op in other environments until an external delivery provider is added.

The verify response includes an HS256 access token to preserve the existing API contract. Configure `JWT_SECRET` as a Base64-encoded key with at least 32 decoded bytes and optionally set `JWT_ACCESS_TOKEN_TTL` (default `PT1H`). This is token creation only: JWT validation middleware, protected routes, and `/api/auth/me` are intentionally deferred to S04-06.
