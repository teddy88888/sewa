import { Router } from "express";
import { db } from "@workspace/db";
import { paymentsTable, bookingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "./auth";
import { z } from "zod";

const router = Router();

router.post("/payments", authMiddleware, async (req: any, res) => {
  const Schema = z.object({
    bookingId: z.number().int().positive(),
    method: z.enum(["bank_transfer", "gopay", "ovo", "dana"]),
  });

  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { bookingId, method } = parsed.data;
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.renterId !== req.userId) return res.status(403).json({ error: "Forbidden" });

  const [payment] = await db.insert(paymentsTable).values({
    bookingId,
    amount: booking.totalAmount,
    status: "paid",
    method,
    paidAt: new Date(),
  }).returning();

  // Update booking status to paid
  await db.update(bookingsTable)
    .set({ status: "paid", updatedAt: new Date() })
    .where(eq(bookingsTable.id, bookingId));

  return res.status(201).json({
    id: payment.id,
    bookingId: payment.bookingId,
    amount: Number(payment.amount),
    status: payment.status,
    method: payment.method,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
  });
});

router.get("/payments/:id", authMiddleware, async (req: any, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, id)).limit(1);
  if (!payment) return res.status(404).json({ error: "Payment not found" });

  return res.json({
    id: payment.id,
    bookingId: payment.bookingId,
    amount: Number(payment.amount),
    status: payment.status,
    method: payment.method,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
  });
});

export default router;
