import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import { customerController } from "../controllers/customer.controller";
import {
  customerAddressSchema,
  groupOrderSchema,
  mealPlanSchema,
  scheduledOrderSchema
} from "../validators/commerce.validator";

const router = Router();

router.use(authenticate, authorize(UserRole.CUSTOMER));
router.get("/profile", asyncHandler(customerController.profile));
router.get("/orders", asyncHandler(customerController.orders));
router.get("/favorites", asyncHandler(customerController.favorites));
router.get("/addresses", asyncHandler(customerController.addresses));
router.post("/addresses", validate(customerAddressSchema), asyncHandler(customerController.createAddress));
router.get("/retention-overview", asyncHandler(customerController.retentionOverview));
router.post("/group-orders", validate(groupOrderSchema), asyncHandler(customerController.createGroupOrder));
router.post("/scheduled-orders", validate(scheduledOrderSchema), asyncHandler(customerController.createScheduledOrder));
router.post("/meal-plans", validate(mealPlanSchema), asyncHandler(customerController.createMealPlan));

export default router;
