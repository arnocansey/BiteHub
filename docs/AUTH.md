# BiteHub Authentication and RBAC

## JWT Flow

1. User signs up or logs in through role-specific auth endpoints.
2. Backend verifies credentials and issues access and refresh tokens.
3. Mobile apps and admin dashboard attach the access token as `Bearer <token>`.
4. Protected routes pass through `authenticate`, which decodes the JWT.
5. Sensitive routes also pass through `authorize(...roles)` to enforce RBAC.

## Role Enforcement

- Customers can access discovery, cart, checkout, favorites, reviews, and personal orders.
- Vendors can access restaurant management, menus, vendor analytics, and their restaurant orders.
- Riders can access delivery jobs, availability, navigation, earnings, and delivery history.
- Admins can access global analytics, approvals, user management, categories, and system settings.

## Security Checklist

- Passwords are hashed with bcrypt before storage.
- Request validation is enforced with Zod.
- Rate limiting and Helmet are enabled globally.
- Payment webhooks must be signature-verified before order/payment mutation.
- Refresh token rotation should be added before production launch.
