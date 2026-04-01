# BiteHub Real-Time Design

## Channels

- `order:{orderId}` for customer, vendor, rider, and admin order timeline events
- `vendor:{vendorId}` for new incoming orders and kitchen status updates
- `rider:{riderId}` for dispatch offers, accept/decline results, and delivery milestones
- `admin:ops` for operational alerts and system-wide event monitoring

## Event Examples

- `order:update`
- `order:accepted`
- `order:preparing`
- `order:ready`
- `delivery:assigned`
- `delivery:picked-up`
- `delivery:location`
- `delivery:completed`
- `notification:new`

## Data Flow

1. Backend persists the state change in PostgreSQL.
2. Backend emits the matching socket event to interested rooms.
3. Clients update local state stores immediately.
4. Push notifications are sent for backgrounded devices.

## Production Recommendation

- Keep Socket.IO for live app sessions.
- Use Expo push notifications for background alerts.
- Introduce Redis adapter when scaling across multiple backend instances.
