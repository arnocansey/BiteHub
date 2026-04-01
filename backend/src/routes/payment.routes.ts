import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { paymentController } from "../controllers/payment.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import { paymentInitializeSchema, paymentVerifySchema } from "../validators/commerce.validator";

const router = Router();

router.post(
  "/initialize",
  authenticate,
  authorize(UserRole.CUSTOMER),
  validate(paymentInitializeSchema),
  asyncHandler(paymentController.initialize)
);
router.post(
  "/verify",
  authenticate,
  authorize(UserRole.CUSTOMER),
  validate(paymentVerifySchema),
  asyncHandler(paymentController.verify)
);
router.post("/paystack/webhook", asyncHandler(paymentController.handleWebhook));

export default router;
