import { Router } from "express";
import { db } from "@workspace/db";
import { messagesTable, bookingsTable, usersTable } from "@workspace/db";
import { eq, and, or, desc } from "drizzle-orm";
import { authMiddleware } from "./auth";
import { z } from "zod";

const router = Router();

const sendMessageSchema = z.object({
  content: z.string().min(1).max(1000),
});

function formatMsg(
  msg: typeof messagesTable.$inferSelect,
  senderName: string
) {
  return {
    id: msg.id,
    bookingId: msg.bookingId,
    senderId: msg.senderId,
    senderName,
    receiverId: msg.receiverId,
    content: msg.content,
    isRead: msg.isRead,
    createdAt: msg.createdAt,
  };
}

// GET /bookings/:id/messages
router.get("/bookings/:id/messages", authMiddleware, async (req: any, res) => {
  const bookingId = Number(req.params.id);
  if (isNaN(bookingId)) return res.status(400).json({ error: "Invalid id" });

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, bookingId))
    .limit(1);

  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.renterId !== req.userId && booking.ownerId !== req.userId)
    return res.status(403).json({ error: "Forbidden" });

  const rows = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.bookingId, bookingId))
    .orderBy(messagesTable.createdAt);

  const senderIds = [...new Set(rows.map((r) => r.senderId))];
  const users =
    senderIds.length > 0
      ? await db
          .select({ id: usersTable.id, name: usersTable.name })
          .from(usersTable)
      : [];
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  const unreadCount = rows.filter(
    (m) => !m.isRead && m.receiverId === req.userId
  ).length;

  return res.json({
    messages: rows.map((m) =>
      formatMsg(m, userMap.get(m.senderId) ?? "Pengguna")
    ),
    unreadCount,
  });
});

// POST /bookings/:id/messages
router.post("/bookings/:id/messages", authMiddleware, async (req: any, res) => {
  const bookingId = Number(req.params.id);
  if (isNaN(bookingId)) return res.status(400).json({ error: "Invalid id" });

  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid input" });

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, bookingId))
    .limit(1);

  if (!booking) return res.status(404).json({ error: "Booking not found" });

  const userId = req.userId as number;
  let receiverId: number;
  if (booking.renterId === userId) {
    receiverId = booking.ownerId;
  } else if (booking.ownerId === userId) {
    receiverId = booking.renterId;
  } else {
    return res.status(403).json({ error: "Forbidden" });
  }

  const [msg] = await db
    .insert(messagesTable)
    .values({
      bookingId,
      senderId: userId,
      receiverId,
      content: parsed.data.content,
    })
    .returning();

  const [sender] = await db
    .select({ name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  return res.status(201).json(formatMsg(msg, sender?.name ?? "Pengguna"));
});

// POST /bookings/:id/messages/read
router.post("/bookings/:id/messages/read", authMiddleware, async (req: any, res) => {
  const bookingId = Number(req.params.id);
  if (isNaN(bookingId)) return res.status(400).json({ error: "Invalid id" });

  const result = await db
    .update(messagesTable)
    .set({ isRead: true })
    .where(
      and(
        eq(messagesTable.bookingId, bookingId),
        eq(messagesTable.receiverId, req.userId)
      )
    )
    .returning({ id: messagesTable.id });

  return res.json({ updated: result.length });
});

// GET /messages/unread
router.get("/messages/unread", authMiddleware, async (req: any, res) => {
  const rows = await db
    .select({ id: messagesTable.id })
    .from(messagesTable)
    .where(
      and(
        eq(messagesTable.receiverId, req.userId),
        eq(messagesTable.isRead, false)
      )
    );

  return res.json({ total: rows.length });
});

export default router;
