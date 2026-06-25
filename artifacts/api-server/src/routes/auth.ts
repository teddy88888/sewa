import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { z } from "zod";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "sewa_salt_2024").digest("hex");
}

function generateToken(userId: number): string {
  return crypto.createHash("sha256").update(`${userId}_${Date.now()}_sewa`).digest("hex");
}

// In-memory token store (simple MVP approach)
const tokenStore = new Map<string, number>(); // token -> userId

export function getUserIdFromToken(token: string): number | null {
  return tokenStore.get(token) ?? null;
}

export function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  const userId = getUserIdFromToken(token);
  if (!userId) {
    return res.status(401).json({ error: "Invalid token" });
  }
  req.userId = userId;
  next();
}

const RegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { name, email, password, phone } = parsed.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) return res.status(400).json({ error: "Email already registered" });

  const passwordHash = hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    name, email, passwordHash, phone: phone ?? null, role: "penyewa",
  }).returning();

  const token = generateToken(user.id);
  tokenStore.set(token, user.id);

  return res.status(201).json({
    user: {
      id: user.id, name: user.name, email: user.email, phone: user.phone,
      role: user.role, avatarUrl: user.avatarUrl, rating: user.rating ? Number(user.rating) : null,
      totalTransactions: user.totalTransactions, depositBalance: Number(user.depositBalance),
      createdAt: user.createdAt,
    },
    token,
  });
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const passwordHash = hashPassword(password);
  if (user.passwordHash !== passwordHash) return res.status(401).json({ error: "Invalid credentials" });

  const token = generateToken(user.id);
  tokenStore.set(token, user.id);

  return res.json({
    user: {
      id: user.id, name: user.name, email: user.email, phone: user.phone,
      role: user.role, avatarUrl: user.avatarUrl, rating: user.rating ? Number(user.rating) : null,
      totalTransactions: user.totalTransactions, depositBalance: Number(user.depositBalance),
      createdAt: user.createdAt,
    },
    token,
  });
});

router.post("/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    tokenStore.delete(authHeader.slice(7));
  }
  return res.json({ success: true });
});

router.get("/auth/me", authMiddleware, async (req: any, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
  if (!user) return res.status(401).json({ error: "User not found" });

  return res.json({
    id: user.id, name: user.name, email: user.email, phone: user.phone,
    role: user.role, avatarUrl: user.avatarUrl, rating: user.rating ? Number(user.rating) : null,
    totalTransactions: user.totalTransactions, depositBalance: Number(user.depositBalance),
    createdAt: user.createdAt,
  });
});

export default router;
