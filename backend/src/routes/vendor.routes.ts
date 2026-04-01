import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import { vendorController } from "../controllers/vendor.controller";
import {
  createVendorRestaurantSchema,
  createMenuItemSchema,
  orderStatusUpdateSchema,
  updateVendorRestaurantSchema,
  updateMenuItemSchema,
  vendorOperatingStateSchema,
  vendorSettingsSchema
} from "../validators/commerce.validator";

const router = Router();

router.use(authenticate, authorize(UserRole.VENDOR));
router.get("/dashboard", asyncHandler(vendorController.dashboard));
router.get("/settings", asyncHandler(vendorController.settings));
router.get("/restaurants/me", asyncHandler(vendorController.restaurantsMe));
router.post("/restaurants", validate(createVendorRestaurantSchema), asyncHandler(vendorController.createRestaurant));
router.patch("/restaurants/:restaurantId", validate(updateVendorRestaurantSchema), asyncHandler(vendorController.updateRestaurant));
router.get("/orders", asyncHandler(vendorController.orders));
router.get("/forecasts", asyncHandler(vendorController.forecasts));
router.patch(
  "/orders/:orderId/status",
  validate(orderStatusUpdateSchema),
  asyncHandler(vendorController.updateOrderStatus)
);
router.patch(
  "/operating-state",
  validate(vendorOperatingStateSchema),
  asyncHandler(vendorController.updateOperatingState)
);
router.patch("/settings", validate(vendorSettingsSchema), asyncHandler(vendorController.updateSettings));
router.get("/menu-items", asyncHandler(vendorController.menuItems));
router.post("/menu-items", validate(createMenuItemSchema), asyncHandler(vendorController.createMenuItem));
router.patch("/menu-items/:menuItemId", validate(updateMenuItemSchema), asyncHandler(vendorController.updateMenuItem));
router.delete("/menu-items/:menuItemId", asyncHandler(vendorController.deleteMenuItem));

export default router;
