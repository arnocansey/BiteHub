import { Router } from "express";
import adminRoutes from "./admin.routes";
import authRoutes from "./auth.routes";
import cartRoutes from "./cart.routes";
import catalogRoutes from "./catalog.routes";
import customerRoutes from "./customer.routes";
import notificationRoutes from "./notification.routes";
import orderRoutes from "./order.routes";
import paymentRoutes from "./payment.routes";
import promoRoutes from "./promo.routes";
import reviewRoutes from "./review.routes";
import riderRoutes from "./rider.routes";
import vendorRoutes from "./vendor.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/", catalogRoutes);
router.use("/cart", cartRoutes);
router.use("/customers", customerRoutes);
router.use("/vendors", vendorRoutes);
router.use("/riders", riderRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/promos", promoRoutes);
router.use("/reviews", reviewRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);

export default router;
