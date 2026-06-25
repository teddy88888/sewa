import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable, itemsTable, usersTable } from "@workspace/db";
import { eq, desc, or, sql } from "drizzle-orm";
import { authMiddleware } from "./auth";

const router = Router();

router.get("/stats/dashboard", authMiddleware, async (req: any, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const recentBookingsRaw = await db
    .select({
      booking: bookingsTable,
      item: { name: itemsTable.name, imageUrl: itemsTable.imageUrl },
    })
    .from(bookingsTable)
    .leftJoin(itemsTable, eq(bookingsTable.itemId, itemsTable.id))
    .where(or(eq(bookingsTable.renterId, req.userId), eq(bookingsTable.ownerId, req.userId)))
    .orderBy(desc(bookingsTable.createdAt))
    .limit(5);

  const recentItemsRaw = await db
    .select({ item: itemsTable, owner: { name: usersTable.name, rating: usersTable.rating } })
    .from(itemsTable)
    .leftJoin(usersTable, eq(itemsTable.ownerId, usersTable.id))
    .where(eq(itemsTable.status, "available"))
    .orderBy(desc(itemsTable.createdAt))
    .limit(6);

  const activeBookings = recentBookingsRaw.filter(r => r.booking.status === "active" || r.booking.status === "paid").length;

  return res.json({
    totalDeposit: Number(user.depositBalance),
    activeBookings,
    totalTransactions: user.totalTransactions,
    rating: user.rating ? Number(user.rating) : 4.8,
    recentBookings: recentBookingsRaw.map(({ booking, item }) => ({
      id: booking.id,
      itemId: booking.itemId,
      itemName: item?.name ?? null,
      itemImageUrl: item?.imageUrl ?? null,
      renterId: booking.renterId,
      renterName: null,
      ownerId: booking.ownerId,
      ownerName: null,
      startDate: booking.startDate,
      endDate: booking.endDate,
      durationDays: booking.durationDays,
      status: booking.status,
      rentalFee: Number(booking.rentalFee),
      depositAmount: Number(booking.depositAmount),
      insuranceFee: Number(booking.insuranceFee),
      serviceFee: Number(booking.serviceFee),
      totalAmount: Number(booking.totalAmount),
      depositStatus: booking.depositStatus,
      returnCondition: booking.returnCondition,
      createdAt: booking.createdAt,
    })),
    recentlyViewed: recentItemsRaw.map(({ item, owner }) => ({
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
      ownerName: owner?.name ?? null,
      ownerRating: owner?.rating ? Number(owner.rating) : null,
      isFavorited: false,
      createdAt: item.createdAt,
    })),
  });
});

router.get("/stats/categories", async (req, res) => {
  const categories = ["buku", "mainan"] as const;
  const results = await Promise.all(
    categories.map(async (cat) => {
      const [total] = await db.select({ count: sql<number>`count(*)` }).from(itemsTable).where(eq(itemsTable.category, cat));
      const [available] = await db.select({ count: sql<number>`count(*)` }).from(itemsTable)
        .where(sql`${itemsTable.category} = ${cat} AND ${itemsTable.status} = 'available'`);
      return {
        category: cat,
        count: Number(total.count),
        availableCount: Number(available.count),
      };
    })
  );

  return res.json(results);
});

export default router;
