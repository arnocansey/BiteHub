# BiteHub

BiteHub is a multi-tenant food delivery platform with:

- `mobile/customer-app` for customers
- `mobile/vendor-app` for restaurant owners
- `mobile/rider-app` for delivery agents
- `web/admin-dashboard` for internal operations
- `backend` for APIs, real-time events, authentication, and business logic

## Monorepo Layout

```text
backend/
mobile/
  customer-app/
  rider-app/
  vendor-app/
web/
  admin-dashboard/
docs/
```

## Included in This Scaffold

- Express + TypeScript backend
- Prisma schema for the full marketplace domain
- JWT auth + RBAC middleware
- Socket.IO event foundation for real-time order tracking
- Next.js admin dashboard starter
- Expo + React Navigation mobile app starters
- Architecture, API, setup, and deployment guides
- EAS build profiles for mobile release workflows
- CI verification workflow for backend and admin dashboard builds

## Quick Start

1. Copy environment files from the provided `.env.example` templates.
2. Install dependencies with `npm install` from the repo root.
3. Start PostgreSQL and create the target databases.
4. Run `npm run dev:backend`.
5. Run `npm run dev:admin`.
6. Run each mobile app with the corresponding workspace script.
7. Run `npm run verify` before release packaging.

Detailed instructions live in [docs/SETUP.md](c:\Users\arnoc\Desktop\Website Projects 2026\BiteHub\docs\SETUP.md).

## Release Commands

- Backend + web verification: `npm run verify`
- Admin dashboard deploy: `npm run deploy:web:vercel`
- Customer mobile release build: `npm run deploy:mobile:customer`
- Vendor mobile release build: `npm run deploy:mobile:vendor`
- Rider mobile release build: `npm run deploy:mobile:rider`
