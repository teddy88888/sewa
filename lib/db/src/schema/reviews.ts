import { pgTable, serial, text, timestamp, integer, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { itemsTable } from "./items";
import { bookingsTable } from "./bookings";
import { sql } from "drizzle-orm";

export const reviewsTable = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    bookingId: integer("booking_id")
      .notNull()
      .references(() => bookingsTable.id),
    itemId: integer("item_id")
      .notNull()
      .references(() => itemsTable.id),
    reviewerId: integer("reviewer_id")
      .notNull()
      .references(() => usersTable.id),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    check("rating_range", sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
  ]
);

export const insertReviewSchema = createInsertSchema(reviewsTable)
  .omit({ id: true, createdAt: true })
  .extend({ rating: z.int().min(1).max(5) });

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
