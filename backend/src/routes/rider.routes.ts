import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import { riderController } from "../controllers/rider.controller";
import {
  availabilitySchema,
  deliveryProofSchema,
  deliveryStatusUpdateSchema,
  riderLocationSchema
} from "../validators/commerce.validator";

const router = Router();

router.use(authenticate, authorize(UserRole.RIDER));
router.get("/profile", asyncHandler(riderController.profile));
router.patch("/availability", validate(availabilitySchema), asyncHandler(riderController.updateAvailability));
router.patch("/location", validate(riderLocationSchema), asyncHandler(riderController.updateLocation));
router.get("/jobs", asyncHandler(riderController.jobs));
router.post("/jobs/:deliveryId/accept", asyncHandler(riderController.acceptJob));
router.post("/jobs/:deliveryId/decline", asyncHandler(riderController.declineJob));
router.patch(
  "/jobs/:deliveryId/status",
  validate(deliveryStatusUpdateSchema),
  asyncHandler(riderController.updateJobStatus)
);
router.post(
  "/jobs/:deliveryId/proof",
  validate(deliveryProofSchema),
  asyncHandler(riderController.addProof)
);
router.get("/earnings", asyncHandler(riderController.earnings));
router.get("/incentives", asyncHandler(riderController.incentives));

export default router;
