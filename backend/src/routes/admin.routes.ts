import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import { adminController } from "../controllers/admin.controller";
import {
  adminSettingsSchema,
  adminCreateVendorSchema,
  adminCreateRiderSchema,
  adminPromoteUserSchema,
  adminReviewRiderSchema,
  adminRiderMessageSchema,
  adminUpdateRiderSchema,
  assignRiderSchema,
  categorySchema,
  payoutRequestReviewSchema,
  settlementActionSchema,
  restaurantCollectionSchema,
  restaurantStatusSchema,
  restaurantStorySchema
} from "../validators/commerce.validator";

const router = Router();

router.use(authenticate, authorize(UserRole.ADMIN));
router.get("/overview", asyncHandler(adminController.overview));
router.get("/users", asyncHandler(adminController.users));
router.get("/vendors", asyncHandler(adminController.vendors));
router.post("/vendors", validate(adminCreateVendorSchema), asyncHandler(adminController.createVendor));
router.patch("/users/:userId/promote-admin", validate(adminPromoteUserSchema), asyncHandler(adminController.promoteCustomerToAdmin));
router.get("/orders", asyncHandler(adminController.orders));
router.get("/orders/:orderId/nearby-riders", asyncHandler(adminController.nearbyRiders));
router.patch("/orders/:orderId/assign-rider", validate(assignRiderSchema), asyncHandler(adminController.assignRider));
router.get("/vendors/pending", asyncHandler(adminController.pendingVendors));
router.patch("/vendors/:vendorId/approve", asyncHandler(adminController.approveVendor));
router.get("/riders/pending", asyncHandler(adminController.pendingRiders));
router.get("/riders/fleet", asyncHandler(adminController.ridersFleet));
router.post("/riders", validate(adminCreateRiderSchema), asyncHandler(adminController.createRider));
router.get("/riders/live", asyncHandler(adminController.liveRiders));
router.patch("/riders/:riderId/approve", asyncHandler(adminController.approveRider));
router.patch("/riders/:riderId/review", validate(adminReviewRiderSchema), asyncHandler(adminController.reviewRider));
router.patch("/riders/:riderId", validate(adminUpdateRiderSchema), asyncHandler(adminController.updateRider));
router.post("/riders/:riderId/message", validate(adminRiderMessageSchema), asyncHandler(adminController.messageRider));
router.get("/categories", asyncHandler(adminController.categories));
router.get("/restaurants", asyncHandler(adminController.restaurantsCatalog));
router.patch("/restaurants/:restaurantId/status", validate(restaurantStatusSchema), asyncHandler(adminController.updateRestaurantStatus));
router.post("/categories", validate(categorySchema), asyncHandler(adminController.createCategory));
router.patch("/categories/:categoryId", validate(categorySchema), asyncHandler(adminController.updateCategory));
router.delete("/categories/:categoryId", asyncHandler(adminController.deleteCategory));
router.get("/collections", asyncHandler(adminController.collections));
router.post("/collections", validate(restaurantCollectionSchema), asyncHandler(adminController.createCollection));
router.patch("/collections/:collectionId", validate(restaurantCollectionSchema), asyncHandler(adminController.updateCollection));
router.patch("/restaurants/:restaurantId/story", validate(restaurantStorySchema), asyncHandler(adminController.updateRestaurantStory));
router.get("/reports/revenue", asyncHandler(adminController.revenueReport));
router.get("/reports/retention", asyncHandler(adminController.retentionReport));
router.get("/reports/operations", asyncHandler(adminController.operationsIntelligence));
router.get("/finance/settlements", asyncHandler(adminController.settlementPreview));
router.get("/finance/payout-requests", asyncHandler(adminController.payoutRequests));
router.patch(
  "/finance/payout-requests/:requestId/approve",
  validate(payoutRequestReviewSchema),
  asyncHandler(adminController.approvePayoutRequest)
);
router.patch(
  "/finance/payout-requests/:requestId/reject",
  validate(payoutRequestReviewSchema),
  asyncHandler(adminController.rejectPayoutRequest)
);
router.post("/finance/settlements", validate(settlementActionSchema), asyncHandler(adminController.createSettlementBatch));
router.get("/support-tickets", asyncHandler(adminController.supportTickets));
router.get("/trust/overview", asyncHandler(adminController.trustOverview));
router.get("/settings", asyncHandler(adminController.settings));
router.patch("/settings", validate(adminSettingsSchema), asyncHandler(adminController.updateSettings));

export default router;
