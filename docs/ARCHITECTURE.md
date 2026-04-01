# BiteHub System Architecture

## 1. Text Diagram

```text
                        +-------------------------------+
                        |       Admin Dashboard         |
                        |      Next.js + Tailwind       |
                        +---------------+---------------+
                                        |
                                        | HTTPS / REST
                                        v
+-------------------+       +-----------+-----------+       +-------------------+
| Customer App      |       | BiteHub API           |       | Vendor App        |
| Expo + RN         +-------> Express + Prisma      <-------+ Expo + RN         |
| React Navigation  | REST  | JWT + RBAC + SocketIO | REST  | React Navigation  |
+-------------------+       +-----------+-----------+       +-------------------+
                                        ^
                                        |
                                        | REST / Socket
                        +---------------+---------------+
                        |         Rider App             |
                        |      Expo + React Native      |
                        +-------------------------------+

                                        |
                                        v
                          +-----------------------------+
                          | PostgreSQL + Prisma ORM     |
                          | users, vendors, orders,     |
                          | menus, payments, ratings    |
                          +-----------------------------+

External Services:
- Paystack for card and mobile money payment flows
- Google Maps Platform for geocoding, distance, ETA, routing
- Expo push notifications / FCM / APNs for alerts
```

## 2. Core Modules

- Auth and identity
- User and role management
- Restaurant onboarding and approvals
- Catalog and category management
- Search and discovery
- Cart and checkout
- Payment orchestration
- Order lifecycle management
- Rider dispatch and tracking
- Reviews, favorites, promos, notifications, analytics

## 3. Roles and Permissions

- `CUSTOMER`: browse, order, review, favorite, track deliveries
- `VENDOR`: manage restaurant, menu, incoming orders, analytics
- `RIDER`: accept deliveries, update fulfillment states, manage availability
- `ADMIN`: full platform oversight, approvals, settings, broadcast communication

## 4. Real-Time Channels

- `order:{orderId}` room for customer, vendor, rider, admin updates
- `vendor:{vendorId}` room for new order alerts
- `rider:{riderId}` room for dispatch offers and delivery state changes
- `admin:ops` room for operational visibility

## 5. Recommended Deployment Topology

- Backend on Railway, Render, Fly.io, ECS, or a VPS behind Nginx
- PostgreSQL on Neon, Supabase, Railway, or managed cloud Postgres
- Admin dashboard on Vercel
- Mobile apps on Expo EAS for Android and iOS builds
- Object storage for media assets on Cloudinary or S3
