import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable, itemsTable, usersTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";
import { authMiddleware } from "./auth";
import { z } from "zod";

const router = Router();

const INSURANCE_RATE = 0.02; // 2%
const SERVICE_RATE = 0.10;   // 10%

function formatBooking(booking: any, itemName?: string | null, itemImageUrl?: string | null, renterName?: string | null, ownerName?: string | null) {
  return {
    id: booking.id,
    itemId: booking.itemId,
    itemName: itemName ?? null,
    itemImageUrl: itemImageUrl ?? null,
    renterId: booking.renterId,
    renterName: renterName ?? null,
    ownerId: booking.ownerId,
    ownerName: ownerName ?? null,
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
  };
}

router.get("/bookings", authMiddleware, async (req: any, res) => {
  const { status, role } = req.query;

  let condition: any;
  if (role === "owner") {
    condition = eq(bookingsTable.ownerId, req.userId);
  } else if (role === "renter") {
    condition = eq(bookingsTable.renterId, req.userId);
  } else {
    condition = or(eq(bookingsTable.renterId, req.userId), eq(bookingsTable.ownerId, req.userId));
  }

  let bookings = await db
    .select({
      booking: bookingsTable,
      item: { name: itemsTable.name, imageUrl: itemsTable.imageUrl },
      renter: { name: usersTable.name },
    })
    .from(bookingsTable)
    .leftJoin(itemsTable, eq(bookingsTable.itemId, itemsTable.id))
    .leftJoin(usersTable, eq(bookingsTable.renterId, usersTable.id))
    .where(status ? and(condition, eq(bookingsTable.status, status as any)) : condition);

  return res.json(bookings.map(({ booking, item, renter }) =>
    formatBooking(booking, item?.name, item?.imageUrl, renter?.name)
  ));
});

router.post("/bookings", authMiddleware, async (req: any, res) => {
  const Schema = z.object({
    itemId: z.number().int().positive(),
    startDate: z.string(),
    endDate: z.string(),
  });

  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { itemId, startDate, endDate } = parsed.data;

  const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, itemId)).limit(1);
  if (!item) return res.status(404).json({ error: "Item not found" });
  if (item.status !== "available") return res.status(400).json({ error: "Item not available" });
  if (item.ownerId === req.userId) return res.status(400).json({ error: "Cannot rent your own item" });

  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (durationDays < 1) return res.status(400).json({ error: "Invalid dates" });

  const rentalFee = Number(item.pricePerDay) * durationDays;
  const depositAmount = Number(item.deposit);
  const insuranceFee = rentalFee * INSURANCE_RATE;
  const serviceFee = rentalFee * SERVICE_RATE;
  const totalAmount = rentalFee + depositAmount + insuranceFee + serviceFee;

  const [booking] = await db.insert(bookingsTable).values({
    itemId,
    renterId: req.userId,
    ownerId: item.ownerId,
    startDate,
    endDate,
    durationDays,
    status: "pending",
    rentalFee: String(rentalFee),
    depositAmount: String(depositAmount),
    insuranceFee: String(insuranceFee),
    serviceFee: String(serviceFee),
    totalAmount: String(totalAmount),
    depositStatus: "held",
  }).returning();

  return res.status(201).json(formatBooking(booking, item.name, item.imageUrl));
});

router.get("/bookings/:id", authMiddleware, async (req: any, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [row] = await db
    .select({
      booking: bookingsTable,
      item: { name: itemsTable.name, imageUrl: itemsTable.imageUrl },
      renter: { name: usersTable.name },
    })
    .from(bookingsTable)
    .leftJoin(itemsTable, eq(bookingsTable.itemId, itemsTable.id))
    .leftJoin(usersTable, eq(bookingsTable.renterId, usersTable.id))
    .where(eq(bookingsTable.id, id))
    .limit(1);

  if (!row) return res.status(404).json({ error: "Booking not found" });
  if (row.booking.renterId !== req.userId && row.booking.ownerId !== req.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  return res.json(formatBooking(row.booking, row.item?.name, row.item?.imageUrl, row.renter?.name));
});

router.post("/bookings/:id/confirm", authMiddleware, async (req: any, res) => {
  const id = Number(req.params.id);
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.ownerId !== req.userId) return res.status(403).json({ error: "Forbidden" });

  const [updated] = await db.update(bookingsTable)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(bookingsTable.id, id))
    .returning();

  await db.update(itemsTable).set({ status: "rented", updatedAt: new Date() }).where(eq(itemsTable.id, updated.itemId));

  return res.json(formatBooking(updated));
});

router.post("/bookings/:id/cancel", authMiddleware, async (req: any, res) => {
  const id = Number(req.params.id);
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.renterId !== req.userId && booking.ownerId !== req.userId) return res.status(403).json({ error: "Forbidden" });

  const [updated] = await db.update(bookingsTable)
    .set({ status: "cancelled", depositStatus: "refunded", updatedAt: new Date() })
    .where(eq(bookingsTable.id, id))
    .returning();

  return res.json(formatBooking(updated));
});

router.post("/bookings/:id/return", authMiddleware, async (req: any, res) => {
  const id = Number(req.params.id);
  const Schema = z.object({
    condition: z.enum(["good", "damaged", "lost"]),
    notes: z.string().optional(),
  });

  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.ownerId !== req.userId) return res.status(403).json({ error: "Forbidden" });

  const { condition, notes } = parsed.data;
  const depositStatus = condition === "good" ? "refunded" : "deducted";

  const [updated] = await db.update(bookingsTable)
    .set({ status: "completed", returnCondition: condition, returnNotes: notes ?? null, depositStatus, updatedAt: new Date() })
    .where(eq(bookingsTable.id, id))
    .returning();

  await db.update(itemsTable).set({ status: "available", updatedAt: new Date() }).where(eq(itemsTable.id, updated.itemId));
  await db.update(usersTable).set({ totalTransactions: booking.renterId }).where(eq(usersTable.id, booking.renterId));

  return res.json(formatBooking(updated));
});

export default router;
