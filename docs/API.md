# BiteHub API Design

All endpoints are mounted under `/api/v1`.

## Authentication

- `POST /auth/register/customer` public
- `POST /auth/register/vendor` public
- `POST /auth/register/rider` public
- `POST /auth/login` public
- `POST /auth/refresh` authenticated
- `GET /auth/me` authenticated

## Customers

- `GET /customers/profile` customer
- `PATCH /customers/profile` customer
- `GET /customers/orders` customer
- `GET /customers/favorites` customer
- `POST /customers/favorites/:restaurantId` customer
- `DELETE /customers/favorites/:restaurantId` customer

## Vendors

- `GET /vendors/dashboard` vendor
- `GET /vendors/restaurants/me` vendor
- `PATCH /vendors/restaurants/:restaurantId` vendor
- `GET /vendors/menu-items` vendor
- `POST /vendors/menu-items` vendor
- `PATCH /vendors/menu-items/:menuItemId` vendor
- `DELETE /vendors/menu-items/:menuItemId` vendor
- `GET /vendors/orders` vendor
- `PATCH /vendors/orders/:orderId/status` vendor

## Riders

- `GET /riders/profile` rider
- `PATCH /riders/availability` rider
- `GET /riders/jobs` rider
- `POST /riders/jobs/:deliveryId/accept` rider
- `POST /riders/jobs/:deliveryId/decline` rider
- `PATCH /riders/jobs/:deliveryId/status` rider
- `GET /riders/earnings` rider

## Restaurants and Discovery

- `GET /restaurants` public
- `GET /restaurants/:restaurantId` public
- `GET /restaurants/:restaurantId/menu` public
- `GET /categories` public
- `GET /search` public

## Cart and Orders

- `GET /cart` customer
- `POST /cart/items` customer
- `PATCH /cart/items/:cartItemId` customer
- `DELETE /cart/items/:cartItemId` customer
- `POST /orders/checkout` customer
- `GET /orders/:orderId` authenticated
- `GET /orders/:orderId/track` authenticated
- `PATCH /orders/:orderId/cancel` customer

## Payments and Promotions

- `POST /payments/initialize` customer
- `POST /payments/paystack/webhook` public, signature-verified
- `POST /promos/validate` customer

## Reviews

- `POST /reviews` customer
- `GET /restaurants/:restaurantId/reviews` public

## Notifications

- `GET /notifications` authenticated
- `PATCH /notifications/:notificationId/read` authenticated
- `POST /admin/notifications/broadcast` admin

## Admin

- `GET /admin/overview` admin
- `GET /admin/users` admin
- `GET /admin/orders` admin
- `GET /admin/vendors/pending` admin
- `PATCH /admin/vendors/:vendorId/approve` admin
- `GET /admin/riders/pending` admin
- `PATCH /admin/riders/:riderId/approve` admin
- `GET /admin/categories` admin
- `POST /admin/categories` admin
- `PATCH /admin/categories/:categoryId` admin
- `DELETE /admin/categories/:categoryId` admin
- `GET /admin/reports/revenue` admin
- `GET /admin/settings` admin
- `PATCH /admin/settings` admin
