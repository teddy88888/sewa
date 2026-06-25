import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, walletTransactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authMiddleware } from "./auth";
import { z } from "zod";

const router = Router();

router.get("/users/profile", authMiddleware, async (req: any, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
    rating: user.rating ? Number(user.rating) : null,
    totalTransactions: user.totalTransactions,
    depositBalance: Number(user.depositBalance),
    location: user.location,
    createdAt: user.createdAt,
  });
});

router.patch("/users/profile", authMiddleware, async (req: any, res) => {
  const Schema = z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    avatarUrl: z.string().optional(),
  });

  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const updateData: any = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
  if (parsed.data.location !== undefined) updateData.location = parsed.data.location;
  if (parsed.data.avatarUrl !== undefined) updateData.avatarUrl = parsed.data.avatarUrl;

  const [updated] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, req.userId)).returning();

  return res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    phone: updated.phone,
    role: updated.role,
    avatarUrl: updated.avatarUrl,
    rating: updated.rating ? Number(updated.rating) : null,
    totalTransactions: updated.totalTransactions,
    depositBalance: Number(updated.depositBalance),
    location: updated.location,
    createdAt: updated.createdAt,
  });
});

router.get("/users/wallet", authMiddleware, async (req: any, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const transactions = await db.select().from(walletTransactionsTable)
    .where(eq(walletTransactionsTable.userId, req.userId))
    .orderBy(desc(walletTransactionsTable.createdAt))
    .limit(20);

  const balance = Number(user.depositBalance);
  const heldAmount = balance * 0.3; // simplified: 30% held for active bookings
  const availableBalance = balance - heldAmount;

  return res.json({
    balance,
    heldAmount,
    availableBalance,
    transactions: transactions.map(t => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      description: t.description,
      createdAt: t.createdAt,
    })),
  });
});

export default router;
