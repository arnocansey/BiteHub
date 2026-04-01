import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { reviewController } from "../controllers/review.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import { reviewSchema } from "../validators/commerce.validator";

const router = Router();

router.post("/", authenticate, authorize(UserRole.CUSTOMER), validate(reviewSchema), asyncHandler(reviewController.create));
router.get("/restaurants/:restaurantId/reviews", asyncHandler(reviewController.listByRestaurant));

export default router;
