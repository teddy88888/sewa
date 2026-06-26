import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, bookingsTable, itemsTable } from "@workspace/db";
import { eq, avg, count, desc } from "drizzle-orm";
import { authMiddleware } from "./auth";
import { z } from "zod";

const router = Router();

const createReviewSchema = z.object({
  bookingId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// GET /items/:id/reviews
router.get("/items/:id/reviews", async (req, res) => {
  const itemId = Number(req.params.id);
  if (isNaN(itemId)) return res.status(400).json({ error: "Invalid item id" });

  const rows = await db
    .select({
      id: reviewsTable.id,
      bookingId: reviewsTable.bookingId,
      rating: reviewsTable.rating,
      comment: reviewsTable.comment,
      createdAt: reviewsTable.createdAt,
      reviewerId: reviewsTable.reviewerId,
    })
    .from(reviewsTable)
    .where(eq(reviewsTable.itemId, itemId))
    .orderBy(desc(reviewsTable.createdAt));

  // Fetch reviewer names in one pass
  const { usersTable } = await import("@workspace/db");
  const userIds = [...new Set(rows.map((r) => r.reviewerId))];
  const users =
    userIds.length > 0
      ? await db
          .select({ id: usersTable.id, name: usersTable.name })
          .from(usersTable)
      : [];
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  const reviews = rows.map((r) => ({
    id: r.id,
    bookingId: r.bookingId,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    reviewerId: r.reviewerId,
    reviewerName: userMap.get(r.reviewerId) ?? "Pengguna",
  }));

  return res.json({ reviews });
});

// POST /reviews
router.post("/reviews", authMiddleware, async (req: any, res) => {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Data tidak valid", details: parsed.error.format() });
  }

  const { bookingId, rating, comment } = parsed.data;
  const userId = req.userId as number;

  // Verify booking exists and belongs to this renter, and is completed
  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, bookingId))
    .limit(1);

  if (!booking) return res.status(404).json({ error: "Pesanan tidak ditemukan" });
  if (booking.renterId !== userId)
    return res.status(403).json({ error: "Kamu bukan penyewa pesanan ini" });
  if (booking.status !== "completed" && booking.status !== "active")
    return res.status(400).json({ error: "Pesanan belum selesai" });

  // Prevent duplicate review
  const [existing] = await db
    .select({ id: reviewsTable.id })
    .from(reviewsTable)
    .where(eq(reviewsTable.bookingId, bookingId))
    .limit(1);
  if (existing) return res.status(409).json({ error: "Ulasan sudah diberikan untuk pesanan ini" });

  // Insert review
  const [review] = await db
    .insert(reviewsTable)
    .values({
      bookingId,
      itemId: booking.itemId,
      reviewerId: userId,
      rating,
      comment: comment ?? null,
    })
    .returning();

  // Recompute item rating
  const [agg] = await db
    .select({ avg: avg(reviewsTable.rating), cnt: count(reviewsTable.id) })
    .from(reviewsTable)
    .where(eq(reviewsTable.itemId, booking.itemId));

  await db
    .update(itemsTable)
    .set({
      rating: agg.avg ?? null,
      reviewCount: Number(agg.cnt),
    })
    .where(eq(itemsTable.id, booking.itemId));

  return res.status(201).json({ review });
});

export default router;
