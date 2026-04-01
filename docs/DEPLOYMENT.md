# BiteHub Deployment Guide

## Backend

- Verify with `npm run verify`
- Build with `npm --prefix backend run build`
- Provision PostgreSQL
- Set production environment variables
- Run migrations with `npm --prefix backend run prisma:deploy`
- Deploy behind HTTPS with sticky websocket support if needed
- Included deployment options:
  - Docker image via [backend/Dockerfile](/c:/Users/arnoc/Desktop/Website%20Projects%202026/BiteHub/backend/Dockerfile)
  - Render service via [render.yaml](/c:/Users/arnoc/Desktop/Website%20Projects%202026/BiteHub/render.yaml)
  - Railway Node service using the `backend` folder as the service root

Recommended production env:
- `NODE_ENV=production`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_WEBHOOK_SECRET`
- `GOOGLE_MAPS_API_KEY`
- `CLIENT_APP_URL`
- `ADMIN_DASHBOARD_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## Railway Backend

- Create a new Railway project and deploy from the `BiteHub` repo
- Set the service root to `backend`
- Start command: `npm run start`
- Install command: `npm install`
- Add a PostgreSQL database plugin or point `DATABASE_URL` to your external Postgres
- Run migrations after deploy with `npm run prisma:deploy`

Suggested Railway env values:
- `NODE_ENV=production`
- `PORT=4000`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL=12h`
- `JWT_REFRESH_TTL=90d`
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_WEBHOOK_SECRET`
- `GOOGLE_MAPS_API_KEY`
- `CLIENT_APP_URL`
- `ADMIN_DASHBOARD_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

SMTP notes for Railway:
- Railway supports outbound SMTP connections
- Use an external SMTP provider such as Brevo, SendGrid, Mailgun, Zoho, or another transactional mail provider
- Password reset emails now use SMTP when configured
- If SMTP is missing, the API still creates reset tokens, but email delivery is skipped

## Admin Dashboard

- Deploy `web/admin-dashboard` to Vercel
- Root command: `npm run deploy:web:vercel`
- Set `NEXT_PUBLIC_API_BASE_URL`
- Protect admin routes with server-side session validation or JWT cookie checks
- Vercel project config is in [web/admin-dashboard/vercel.json](/c:/Users/arnoc/Desktop/Website%20Projects%202026/BiteHub/web/admin-dashboard/vercel.json)

## Mobile Apps

- Use Expo EAS Build for Android and iOS
- Use the root `eas.json` production profile
- Configure bundle identifiers and signing credentials
- Add production API URLs
- Add APNs and FCM credentials for push notifications
- Customer release: `npm run deploy:mobile:customer`
- Vendor release: `npm run deploy:mobile:vendor`
- Rider release: `npm run deploy:mobile:rider`

## Production Notes

- Store uploads outside the app filesystem
- Enable structured logging and error reporting
- Add monitoring with Sentry, Datadog, or Grafana
- Rotate JWT secrets and webhook secrets
- Use a job queue for notification fanout and heavy reporting
- Upgrade vulnerable dependencies before every release window
- Rotate the current Neon database credential if it has been shared outside this machine
