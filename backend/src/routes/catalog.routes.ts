import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { catalogController } from "../controllers/catalog.controller";

const router = Router();

router.get("/restaurants", asyncHandler(catalogController.listRestaurants));
router.get("/restaurants/:restaurantId", asyncHandler(catalogController.getRestaurant));
router.get("/restaurants/:restaurantId/menu", asyncHandler(catalogController.getRestaurantMenu));
router.get("/restaurants/:restaurantId/highlights", asyncHandler(catalogController.restaurantHighlights));
router.get("/collections", asyncHandler(catalogController.listCollections));
router.get("/categories", asyncHandler(catalogController.listCategories));
router.get("/search", asyncHandler(catalogController.search));

export default router;
