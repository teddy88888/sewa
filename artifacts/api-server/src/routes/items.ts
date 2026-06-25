import { Router } from "express";
import { db } from "@workspace/db";
import { itemsTable, usersTable, favoritesTable } from "@workspace/db";
import { eq, and, like, desc, sql } from "drizzle-orm";
import { authMiddleware } from "./auth";
import { z } from "zod";

const router = Router();

function formatItem(item: any, ownerName?: string | null, ownerRating?: string | null, isFavorited = false) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    description: item.description,
    pricePerDay: Number(item.pricePerDay),
    deposit: Number(item.deposit),
    location: item.location,
    status: item.status,
    imageUrl: item.imageUrl,
    rating: item.rating ? Number(item.rating) : null,
    reviewCount: item.reviewCount,
    ownerId: item.ownerId,
    ownerName: ownerName ?? null,
    ownerRating: ownerRating ? Number(ownerRating) : null,
    isFavorited,
    createdAt: item.createdAt,
  };
}

router.get("/items", async (req: any, res) => {
  const { category, search, status, limit = "20", offset = "0" } = req.query;

  let query = db
    .select({ item: itemsTable, owner: { name: usersTable.name, rating: usersTable.rating } })
    .from(itemsTable)
    .leftJoin(usersTable, eq(itemsTable.ownerId, usersTable.id))
    .$dynamic();

  const conditions: any[] = [];
  if (category) conditions.push(eq(itemsTable.category, category as any));
  if (status) conditions.push(eq(itemsTable.status, status as any));
  if (search) conditions.push(like(itemsTable.name, `%${search}%`));

  if (conditions.length > 0) query = query.where(and(...conditions));

  const allItems = await query.orderBy(desc(itemsTable.createdAt)).limit(Number(limit)).offset(Number(offset));

  // Get favorites if authenticated
  let favoriteItemIds = new Set<number>();
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const { getUserIdFromToken } = await import("./auth");
    const userId = getUserIdFromToken(authHeader.slice(7));
    if (userId) {
      const favs = await db.select({ itemId: favoritesTable.itemId }).from(favoritesTable).where(eq(favoritesTable.userId, userId));
      favoriteItemIds = new Set(favs.map(f => f.itemId));
    }
  }

  const countResult = await db.select({ count: sql<number>`count(*)` }).from(itemsTable);
  const total = Number(countResult[0].count);

  return res.json({
    items: allItems.map(({ item, owner }) =>
      formatItem(item, owner?.name, owner?.rating, favoriteItemIds.has(item.id))
    ),
    total,
  });
});

router.post("/items", authMiddleware, async (req: any, res) => {
  const ItemSchema = z.object({
    name: z.string().min(1),
    category: z.enum(["buku", "mainan"]),
    description: z.string().optional(),
    pricePerDay: z.number().positive(),
    deposit: z.number().positive(),
    location: z.string().optional(),
    imageUrl: z.string().optional(),
  });

  const parsed = ItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { name, category, description, pricePerDay, deposit, location, imageUrl } = parsed.data;
  const [item] = await db.insert(itemsTable).values({
    ownerId: req.userId,
    name, category,
    description: description ?? null,
    pricePerDay: String(pricePerDay),
    deposit: String(deposit),
    location: location ?? null,
    imageUrl: imageUrl ?? null,
    status: "available",
  }).returning();

  const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
  return res.status(201).json(formatItem(item, owner?.name, owner?.rating));
});

router.get("/items/featured", async (req, res) => {
  const items = await db
    .select({ item: itemsTable, owner: { name: usersTable.name, rating: usersTable.rating } })
    .from(itemsTable)
    .leftJoin(usersTable, eq(itemsTable.ownerId, usersTable.id))
    .where(eq(itemsTable.status, "available"))
    .orderBy(desc(itemsTable.reviewCount))
    .limit(8);

  return res.json(items.map(({ item, owner }) => formatItem(item, owner?.name, owner?.rating)));
});

router.get("/items/recent", async (req, res) => {
  const items = await db
    .select({ item: itemsTable, owner: { name: usersTable.name, rating: usersTable.rating } })
    .from(itemsTable)
    .leftJoin(usersTable, eq(itemsTable.ownerId, usersTable.id))
    .orderBy(desc(itemsTable.createdAt))
    .limit(6);

  return res.json(items.map(({ item, owner }) => formatItem(item, owner?.name, owner?.rating)));
});

router.get("/items/my", authMiddleware, async (req: any, res) => {
  const items = await db
    .select({ item: itemsTable, owner: { name: usersTable.name, rating: usersTable.rating } })
    .from(itemsTable)
    .leftJoin(usersTable, eq(itemsTable.ownerId, usersTable.id))
    .where(eq(itemsTable.ownerId, req.userId))
    .orderBy(desc(itemsTable.createdAt));

  return res.json(items.map(({ item, owner }) => formatItem(item, owner?.name, owner?.rating)));
});

router.get("/items/favorites", authMiddleware, async (req: any, res) => {
  const items = await db
    .select({ item: itemsTable, owner: { name: usersTable.name, rating: usersTable.rating } })
    .from(itemsTable)
    .leftJoin(usersTable, eq(itemsTable.ownerId, usersTable.id))
    .innerJoin(favoritesTable, and(eq(favoritesTable.itemId, itemsTable.id), eq(favoritesTable.userId, req.userId)))
    .orderBy(desc(favoritesTable.createdAt));

  return res.json(items.map(({ item, owner }) => formatItem(item, owner?.name, owner?.rating, true)));
});

router.get("/items/:id", async (req: any, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [row] = await db
    .select({ item: itemsTable, owner: { name: usersTable.name, rating: usersTable.rating } })
    .from(itemsTable)
    .leftJoin(usersTable, eq(itemsTable.ownerId, usersTable.id))
    .where(eq(itemsTable.id, id))
    .limit(1);

  if (!row) return res.status(404).json({ error: "Item not found" });

  let isFavorited = false;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const { getUserIdFromToken } = await import("./auth");
    const userId = getUserIdFromToken(authHeader.slice(7));
    if (userId) {
      const fav = await db.select().from(favoritesTable)
        .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.itemId, id))).limit(1);
      isFavorited = fav.length > 0;
    }
  }

  return res.json(formatItem(row.item, row.owner?.name, row.owner?.rating, isFavorited));
});

router.patch("/items/:id", authMiddleware, async (req: any, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [existing] = await db.select().from(itemsTable).where(eq(itemsTable.id, id)).limit(1);
  if (!existing) return res.status(404).json({ error: "Item not found" });
  if (existing.ownerId !== req.userId) return res.status(403).json({ error: "Forbidden" });

  const { name, category, description, pricePerDay, deposit, location, imageUrl, status } = req.body;
  const updateData: any = { updatedAt: new Date() };
  if (name !== undefined) updateData.name = name;
  if (category !== undefined) updateData.category = category;
  if (description !== undefined) updateData.description = description;
  if (pricePerDay !== undefined) updateData.pricePerDay = String(pricePerDay);
  if (deposit !== undefined) updateData.deposit = String(deposit);
  if (location !== undefined) updateData.location = location;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (status !== undefined) updateData.status = status;

  const [updated] = await db.update(itemsTable).set(updateData).where(eq(itemsTable.id, id)).returning();
  const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, updated.ownerId)).limit(1);
  return res.json(formatItem(updated, owner?.name, owner?.rating));
});

router.delete("/items/:id", authMiddleware, async (req: any, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [existing] = await db.select().from(itemsTable).where(eq(itemsTable.id, id)).limit(1);
  if (!existing) return res.status(404).json({ error: "Item not found" });
  if (existing.ownerId !== req.userId) return res.status(403).json({ error: "Forbidden" });

  await db.delete(itemsTable).where(eq(itemsTable.id, id));
  return res.status(204).send();
});

router.post("/items/:id/favorite", authMiddleware, async (req: any, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const existing = await db.select().from(favoritesTable)
    .where(and(eq(favoritesTable.userId, req.userId), eq(favoritesTable.itemId, id))).limit(1);

  if (existing.length > 0) {
    await db.delete(favoritesTable).where(and(eq(favoritesTable.userId, req.userId), eq(favoritesTable.itemId, id)));
    return res.json({ isFavorited: false });
  } else {
    await db.insert(favoritesTable).values({ userId: req.userId, itemId: id });
    return res.json({ isFavorited: true });
  }
});

export default router;
