import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { cartController } from "../controllers/cart.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import { addCartItemSchema, updateCartItemSchema } from "../validators/commerce.validator";

const router = Router();

router.use(authenticate, authorize(UserRole.CUSTOMER));
router.get("/", asyncHandler(cartController.getCart));
router.post("/items", validate(addCartItemSchema), asyncHandler(cartController.addItem));
router.patch("/items/:cartItemId", validate(updateCartItemSchema), asyncHandler(cartController.updateItem));
router.delete("/items/:cartItemId", asyncHandler(cartController.removeItem));

export default router;
