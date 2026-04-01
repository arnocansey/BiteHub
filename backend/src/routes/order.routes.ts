import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import { orderController } from "../controllers/order.controller";
import {
  checkoutSchema,
  orderSupportTicketSchema
} from "../validators/commerce.validator";

const router = Router();

router.use(authenticate);
router.post(
  "/checkout",
  authorize(UserRole.CUSTOMER),
  validate(checkoutSchema),
  asyncHandler(orderController.checkout)
);
router.get("/:orderId", asyncHandler(orderController.getOrder));
router.get("/:orderId/track", asyncHandler(orderController.trackOrder));
router.get("/:orderId/timeline", asyncHandler(orderController.timeline));
router.get("/:orderId/eta", asyncHandler(orderController.eta));
router.post(
  "/:orderId/support",
  validate(orderSupportTicketSchema),
  asyncHandler(orderController.createSupportTicket)
);
router.patch(
  "/:orderId/cancel",
  authorize(UserRole.CUSTOMER),
  asyncHandler(orderController.cancelOrder)
);

export default router;
