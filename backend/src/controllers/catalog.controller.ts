import type { Request, Response } from "express";
import { MenuItemStatus } from "../generated/prisma/client";
import { prisma } from "../config/prisma";

const restaurantCardInclude = {
  category: true,
  menuItems: {
    where: { status: MenuItemStatus.AVAILABLE },
    include: { dietaryTags: { include: { dietaryTag: true } } },
    orderBy: [
      { isSignature: "desc" as const },
      { isFeatured: "desc" as const },
      { createdAt: "asc" as const }
    ]
  },
  collectionPlacements: {
    include: { collection: true },
    orderBy: [{ sortOrder: "asc" as const }]
  }
};

export const catalogController = {
  async listRestaurants(req: Request, res: Response) {
    const intent = String(req.query.intent ?? "").trim();
    const restaurants = await prisma.restaurant.findMany({
      where: {
        status: "ACTIVE",
        ...(intent
          ? {
              OR: [
                { storyHeadline: { contains: intent, mode: "insensitive" } },
                { storyBody: { contains: intent, mode: "insensitive" } },
                {
                  collectionPlacements: {
                    some: {
                      collection: {
                        OR: [
                          { name: { contains: intent, mode: "insensitive" } },
                          { description: { contains: intent, mode: "insensitive" } }
                        ]
                      }
                    }
                  }
                }
              ]
            }
          : {})
      },
      include: restaurantCardInclude,
      orderBy: [{ isFeatured: "desc" }, { averageRating: "desc" }, { createdAt: "desc" }]
    });
    res.json(restaurants);
  },

  async getRestaurant(req: Request, res: Response) {
    const restaurantId = String(req.params.restaurantId);
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        ...restaurantCardInclude,
        reviews: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
          take: 6
        }
      }
    });
    res.json(restaurant);
  },

  async getRestaurantMenu(req: Request, res: Response) {
    const restaurantId = String(req.params.restaurantId);
    const menu = await prisma.menuItem.findMany({
      where: { restaurantId, status: { not: MenuItemStatus.ARCHIVED } },
      include: {
        category: true,
        dietaryTags: {
          include: { dietaryTag: true }
        }
      },
      orderBy: [
        { isSignature: "desc" as const },
        { isFeatured: "desc" as const },
        { createdAt: "asc" as const }
      ]
    });
    res.json(menu);
  },

  async listCategories(_req: Request, res: Response) {
    const categories = await prisma.category.findMany();
    res.json(categories);
  },

  async search(req: Request, res: Response) {
    const query = String(req.query.q ?? "");
    const results = await prisma.restaurant.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { storyHeadline: { contains: query, mode: "insensitive" } },
          { menuItems: { some: { name: { contains: query, mode: "insensitive" } } } }
        ]
      },
      include: restaurantCardInclude,
      orderBy: [{ isFeatured: "desc" }, { averageRating: "desc" }]
    });
    res.json(results);
  },

  async restaurantHighlights(req: Request, res: Response) {
    const restaurantId = String(req.params.restaurantId);
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        category: true,
        collectionPlacements: {
          include: { collection: true },
          orderBy: { sortOrder: "asc" }
        },
        menuItems: {
          where: { status: MenuItemStatus.AVAILABLE },
          include: {
            dietaryTags: {
              include: { dietaryTag: true }
            }
          },
          orderBy: [
            { isSignature: "desc" as const },
            { isFeatured: "desc" as const },
            { createdAt: "asc" as const }
          ]
        },
        reviews: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
          take: 3
        }
      }
    });

    if (!restaurant) {
      res.status(404).json({ message: "Restaurant not found." });
      return;
    }

    const signatureItems = restaurant.menuItems.filter((item) => item.isSignature).slice(0, 4);
    const featuredItems = restaurant.menuItems.filter((item) => item.isFeatured).slice(0, 6);
    const dietaryTags = Array.from(
      new Map(
        restaurant.menuItems
          .flatMap((item) => item.dietaryTags.map((tag) => tag.dietaryTag))
          .map((tag) => [tag.id, tag])
      ).values()
    );

    res.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        storyHeadline: restaurant.storyHeadline,
        storyBody: restaurant.storyBody,
        chefNote: restaurant.chefNote,
        ambianceNote: restaurant.ambianceNote,
        priceBand: restaurant.priceBand,
        heroAccent: restaurant.heroAccent,
        category: restaurant.category,
        averageRating: restaurant.averageRating,
        estimatedDeliveryMins: restaurant.estimatedDeliveryMins
      },
      signatureItems,
      featuredItems,
      dietaryTags,
      collections: restaurant.collectionPlacements.map((placement) => ({
        id: placement.collection.id,
        name: placement.collection.name,
        slug: placement.collection.slug,
        description: placement.collection.description,
        blurb: placement.blurb
      })),
      recentReviews: restaurant.reviews
    });
  },

  async listCollections(_req: Request, res: Response) {
    const collections = await prisma.restaurantCollection.findMany({
      where: { isFeatured: true },
      include: {
        restaurants: {
          include: {
            restaurant: {
              include: {
                category: true,
                menuItems: {
                  where: { status: MenuItemStatus.AVAILABLE },
                  orderBy: [
                    { isSignature: "desc" as const },
                    { isFeatured: "desc" as const },
                    { createdAt: "asc" as const }
                  ],
                  take: 3
                }
              }
            }
          },
          orderBy: { sortOrder: "asc" }
        }
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
    });

    res.json(collections);
  }
};
