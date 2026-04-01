import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { authController } from "../controllers/auth.controller";
import {
  adminRegisterSchema,
  customerRegisterSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  resetPasswordSchema,
  riderRegisterSchema,
  vendorRegisterSchema
} from "../validators/auth.validator";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.post("/register/admin", validate(adminRegisterSchema), asyncHandler(authController.registerAdmin));
router.post("/register/customer", validate(customerRegisterSchema), asyncHandler(authController.registerCustomer));
router.post("/register/vendor", validate(vendorRegisterSchema), asyncHandler(authController.registerVendor));
router.post("/register/rider", validate(riderRegisterSchema), asyncHandler(authController.registerRider));
router.post("/login", validate(loginSchema), asyncHandler(authController.login));
router.post("/forgot-password", validate(forgotPasswordSchema), asyncHandler(authController.forgotPassword));
router.post("/reset-password", validate(resetPasswordSchema), asyncHandler(authController.resetPassword));
router.post("/refresh", validate(refreshSchema), asyncHandler(authController.refresh));
router.get("/me", authenticate, asyncHandler(authController.me));

export default router;
