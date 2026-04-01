import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { promoController } from "../controllers/promo.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import { promoValidationSchema } from "../validators/commerce.validator";

const router = Router();

router.post(
  "/validate",
  authenticate,
  authorize(UserRole.CUSTOMER),
  validate(promoValidationSchema),
  asyncHandler(promoController.validate)
);

export default router;
