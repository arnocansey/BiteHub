import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { notificationController } from "../controllers/notification.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import { broadcastNotificationSchema } from "../validators/commerce.validator";

const router = Router();

router.get("/", authenticate, asyncHandler(notificationController.list));
router.patch("/read-all", authenticate, asyncHandler(notificationController.markAllRead));
router.delete("/clear-read", authenticate, asyncHandler(notificationController.clearRead));
router.patch("/:notificationId/read", authenticate, asyncHandler(notificationController.markRead));
router.post(
  "/broadcast",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(broadcastNotificationSchema),
  asyncHandler(notificationController.broadcast)
);

export default router;
