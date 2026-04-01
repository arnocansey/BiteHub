# BiteHub Setup Guide

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 15+
- Expo Go or iOS/Android simulators

## 1. Install Dependencies

```bash
npm install
```

## 2. Environment Files

Create `.env` files based on each app's `.env.example`.

- `backend/.env.example`
- `web/admin-dashboard/.env.example`
- `mobile/customer-app/.env.example`
- `mobile/vendor-app/.env.example`
- `mobile/rider-app/.env.example`

## 3. Database

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

## 4. Run Services

```bash
npm run dev:backend
npm run dev:admin
npm run dev:customer
npm run dev:vendor
npm run dev:rider
```

## 5. Release Verification

```bash
npm run verify
npm run audit:prod
```

## 6. Mobile App Configuration

- Put the backend base URL in each app's environment config.
- Configure Expo push notification credentials.
- Add Google Maps API keys in app config for Android and iOS.
- Add production signing credentials in Expo EAS.

## 7. Payment Setup

- Configure Paystack secret and public keys.
- Expose the backend webhook endpoint publicly.
- Add webhook signature validation before trusting events.
