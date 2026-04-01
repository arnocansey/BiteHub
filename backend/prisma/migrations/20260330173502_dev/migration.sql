-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "badgeText" TEXT,
ADD COLUMN     "calories" INTEGER,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSignature" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "spiceLevel" INTEGER;

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "ambianceNote" TEXT,
ADD COLUMN     "chefNote" TEXT,
ADD COLUMN     "heroAccent" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceBand" TEXT,
ADD COLUMN     "storyBody" TEXT,
ADD COLUMN     "storyHeadline" TEXT;

-- CreateTable
CREATE TABLE "DietaryTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "colorHex" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DietaryTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemDietaryTag" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "dietaryTagId" TEXT NOT NULL,

    CONSTRAINT "MenuItemDietaryTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantCollection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "heroTitle" TEXT,
    "heroCopy" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantCollectionPlacement" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "blurb" TEXT,

    CONSTRAINT "RestaurantCollectionPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DietaryTag_name_key" ON "DietaryTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DietaryTag_slug_key" ON "DietaryTag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemDietaryTag_menuItemId_dietaryTagId_key" ON "MenuItemDietaryTag"("menuItemId", "dietaryTagId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantCollection_slug_key" ON "RestaurantCollection"("slug");

-- CreateIndex
CREATE INDEX "RestaurantCollectionPlacement_collectionId_sortOrder_idx" ON "RestaurantCollectionPlacement"("collectionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantCollectionPlacement_collectionId_restaurantId_key" ON "RestaurantCollectionPlacement"("collectionId", "restaurantId");

-- AddForeignKey
ALTER TABLE "MenuItemDietaryTag" ADD CONSTRAINT "MenuItemDietaryTag_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemDietaryTag" ADD CONSTRAINT "MenuItemDietaryTag_dietaryTagId_fkey" FOREIGN KEY ("dietaryTagId") REFERENCES "DietaryTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantCollectionPlacement" ADD CONSTRAINT "RestaurantCollectionPlacement_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "RestaurantCollection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantCollectionPlacement" ADD CONSTRAINT "RestaurantCollectionPlacement_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
