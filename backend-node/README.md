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

Prisma maps the existing MySQL schema that is owned by Flyway in `../backend/src/main/resources/db/migration`. Set `DATABASE_URL` in your uncommitted `.env` using the placeholder format in `.env.example`; URL-encode reserved credential characters.

The schema is at `prisma/schema.prisma`. Generate the Prisma client after installing dependencies or changing that mapping:

```bash
npm exec prisma generate
```

Do **not** run `prisma migrate`, `prisma db push`, `prisma db seed`, or `prisma migrate reset`. Those commands would conflict with Flyway's ownership of the schema and may alter data. The reusable client is exported by `src/database/prisma.ts`; `isDatabaseAvailable` in `src/database/health.ts` performs a minimal `SELECT 1` check for a future health endpoint.
